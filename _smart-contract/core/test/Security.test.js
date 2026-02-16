const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Security Tests", function () {
  let NooriToken, NooriVault, NooriBankBridge, DidItMeKYC, NooriBankPriceOracle;
  let token, vault, bridge, kyc, oracle;
  let owner, addr1, addr2, attacker;
  let snapshotId;

  before(async function () {
    [owner, addr1, addr2, attacker] = await ethers.getSigners();

    NooriToken = await ethers.getContractFactory("NooriToken");
    NooriVault = await ethers.getContractFactory("NooriBankVault");
    NooriBankBridge = await ethers.getContractFactory("NooriBankBridge");
    DidItMeKYC = await ethers.getContractFactory("DidItMeKYC");
    NooriBankPriceOracle = await ethers.getContractFactory("NooriBankPriceOracle");

    // Deploy contracts
    token = await upgrades.deployProxy(NooriToken, [], { initializer: 'initialize' });
    kyc = await upgrades.deployProxy(DidItMeKYC, [], { initializer: 'initialize' });
    oracle = await upgrades.deployProxy(NooriBankPriceOracle, [], { initializer: 'initialize' });
    
    vault = await upgrades.deployProxy(NooriVault, [
      token.address,
      kyc.address,
      oracle.address
    ], { initializer: 'initialize' });
    
    bridge = await upgrades.deployProxy(NooriBankBridge, [
      token.address,
      ethers.utils.parseEther("0.1")
    ], { initializer: 'initialize' });

    // Setup roles
    await token.grantRole(await token.MINTER_ROLE(), vault.address);
    await token.grantRole(await token.BRIDGE_ROLE(), bridge.address);
    await kyc.grantRole(await kyc.VERIFIER_ROLE(), owner.address);
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  describe("Access Control Tests", function () {
    it("Should prevent unauthorized role assignments", async function () {
      const MINTER_ROLE = await token.MINTER_ROLE();
      await expect(
        token.connect(attacker).grantRole(MINTER_ROLE, attacker.address)
      ).to.be.reverted;
    });

    it("Should prevent unauthorized admin actions", async function () {
      await expect(
        vault.connect(attacker).pause()
      ).to.be.reverted;
    });
  });

  describe("Reentrancy Tests", function () {
    let ReentrancyAttacker;
    let attackerContract;

    beforeEach(async function () {
      ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
      attackerContract = await ReentrancyAttacker.deploy(vault.address);
      
      // Fund attacker
      await token.mint(attackerContract.address, ethers.utils.parseEther("1000"));
    });

    it("Should prevent reentrancy on withdraw", async function () {
      await expect(
        attackerContract.attack()
      ).to.be.reverted;
    });
  });

  describe("Input Validation Tests", function () {
    it("Should reject invalid amounts", async function () {
      await expect(
        vault.deposit(0)
      ).to.be.revertedWith("Invalid amount");
    });

    it("Should enforce KYC limits", async function () {
      const largeAmount = ethers.utils.parseEther("1000000");
      await expect(
        vault.connect(addr1).deposit(largeAmount)
      ).to.be.revertedWith("Exceeds KYC limit");
    });
  });

  describe("Oracle Security Tests", function () {
    it("Should reject stale prices", async function () {
      await oracle.setPriceFeed(
        token.address,
        mockPriceFeed.address,
        3600 // 1 hour heartbeat
      );

      // Simulate time passage
      await ethers.provider.send("evm_increaseTime", [7200]); // 2 hours
      
      await expect(
        vault.connect(addr1).depositCollateral({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("Stale price feed");
    });

    it("Should prevent price manipulation", async function () {
      // Test price deviation limits
      const largePriceChange = ethers.utils.parseEther("1000000");
      await expect(
        oracle.connect(attacker).updatePrice(token.address, largePriceChange)
      ).to.be.reverted;
    });
  });

  describe("Cross-Chain Security Tests", function () {
    it("Should prevent duplicate transaction processing", async function () {
      const txHash = ethers.utils.formatBytes32String("test");
      
      // First process is successful
      await bridge.processRemoteTransaction(txHash, addr1.address, 100);
      
      // Second attempt should fail
      await expect(
        bridge.processRemoteTransaction(txHash, addr1.address, 100)
      ).to.be.revertedWith("Transaction already processed");
    });

    it("Should enforce delayed transfers for large amounts", async function () {
      const largeAmount = ethers.utils.parseEther("100000");
      await token.mint(addr1.address, largeAmount);
      await token.connect(addr1).approve(bridge.address, largeAmount);
      
      await bridge.connect(addr1).lockTokens(largeAmount, "polygon", addr2.address);
      
      // Try to process immediately
      const transferId = ethers.utils.solidityKeccak256(
        ["address", "uint256", "string", "address"],
        [addr1.address, largeAmount, "polygon", addr2.address]
      );
      
      await expect(
        bridge.processDelayedTransfer(transferId)
      ).to.be.revertedWith("Transfer delay not elapsed");
    });
  });

  describe("Upgradeability Tests", function () {
    it("Should preserve state after upgrade", async function () {
      // Setup initial state
      await token.mint(addr1.address, ethers.utils.parseEther("1000"));
      const initialBalance = await token.balanceOf(addr1.address);

      // Upgrade contract
      const NooriTokenV2 = await ethers.getContractFactory("NooriToken");
      const upgradedToken = await upgrades.upgradeProxy(token.address, NooriTokenV2);

      // Verify state preservation
      expect(await upgradedToken.balanceOf(addr1.address)).to.equal(initialBalance);
    });

    it("Should prevent unauthorized upgrades", async function () {
      const NooriTokenV2 = await ethers.getContractFactory("NooriToken", attacker);
      await expect(
        upgrades.upgradeProxy(token.address, NooriTokenV2)
      ).to.be.reverted;
    });
  });

  describe("Gas Tests", function () {
    it("Should not exceed gas limits for core operations", async function () {
      const tx = await token.mint(addr1.address, ethers.utils.parseEther("1"));
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.below(200000);
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow emergency pause", async function () {
      await vault.pause();
      await expect(
        vault.connect(addr1).deposit(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should process pending actions during pause", async function () {
      // Setup delayed transfer
      const amount = ethers.utils.parseEther("100000");
      await token.mint(addr1.address, amount);
      await token.connect(addr1).approve(bridge.address, amount);
      await bridge.connect(addr1).lockTokens(amount, "polygon", addr2.address);
      
      // Pause system
      await vault.pause();
      
      // Should still process after delay
      await ethers.provider.send("evm_increaseTime", [86400]); // 24 hours
      
      const transferId = ethers.utils.solidityKeccak256(
        ["address", "uint256", "string", "address"],
        [addr1.address, amount, "polygon", addr2.address]
      );
      
      await expect(
        bridge.processDelayedTransfer(transferId)
      ).to.not.be.reverted;
    });
  });
});

describe("Integration Security Tests", function () {
  // Add integration tests between components
});