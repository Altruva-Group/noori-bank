const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NooriBankBridge", function () {
  let NooriToken;
  let NooriBankBridge;
  let MockLayerZeroEndpoint;
  let token;
  let bridge;
  let endpoint;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const CHAIN_ID = 1;
  const REMOTE_CHAIN_ID = 2;
  const LARGE_TRANSFER = ethers.utils.parseEther("100000");
  const DELAY_PERIOD = 86400; // 24 hours

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    NooriToken = await ethers.getContractFactory("NooriToken");
    NooriBankBridge = await ethers.getContractFactory("NooriBankBridge");
    MockLayerZeroEndpoint = await ethers.getContractFactory("MockLayerZeroEndpoint");

    token = await upgrades.deployProxy(NooriToken, [], { initializer: 'initialize' });
    endpoint = await MockLayerZeroEndpoint.deploy();
    
    bridge = await upgrades.deployProxy(NooriBankBridge, [
      token.address,
      endpoint.address,
      ethers.utils.parseEther("0.1") // minGasForTransfer
    ], { initializer: 'initialize' });

    await token.grantRole(await token.BRIDGE_ROLE(), bridge.address);
    await token.authorizedBridge(bridge.address, true);

    await token.mint(owner.address, ethers.utils.parseEther("1000000"));
    await token.approve(bridge.address, ethers.utils.parseEther("1000000"));
  });

  describe("Chain Management", function () {
    it("Should register remote chain", async function () {
      const remoteBridge = ethers.Wallet.createRandom().address;
      await bridge.registerChain(REMOTE_CHAIN_ID, remoteBridge);

      const chain = await bridge.supportedChains(REMOTE_CHAIN_ID);
      expect(chain.remoteBridge).to.equal(remoteBridge);
      expect(chain.enabled).to.be.true;
    });

    it("Should toggle chain status", async function () {
      const remoteBridge = ethers.Wallet.createRandom().address;
      await bridge.registerChain(REMOTE_CHAIN_ID, remoteBridge);
      await bridge.toggleChain(REMOTE_CHAIN_ID, false);

      const chain = await bridge.supportedChains(REMOTE_CHAIN_ID);
      expect(chain.enabled).to.be.false;
    });
  });

  describe("Token Transfer", function () {
    const amount = ethers.utils.parseEther("100");
    const targetAddress = ethers.Wallet.createRandom().address;

    beforeEach(async function () {
      const remoteBridge = ethers.Wallet.createRandom().address;
      await bridge.registerChain(REMOTE_CHAIN_ID, remoteBridge);
    });

    it("Should lock tokens for cross-chain transfer", async function () {
      await bridge.lockTokens(amount, "polygon", targetAddress);
      
      const bridgeBalance = await token.balanceOf(bridge.address);
      expect(bridgeBalance).to.equal(amount);
    });

    it("Should delay large transfers", async function () {
      await bridge.lockTokens(LARGE_TRANSFER, "polygon", targetAddress);
      
      const transferId = ethers.utils.solidityKeccak256(
        ["address", "uint256", "string", "address"],
        [owner.address, LARGE_TRANSFER, "polygon", targetAddress]
      );
      
      const transfer = await bridge.pendingTransfers(transferId);
      expect(transfer.amount).to.equal(LARGE_TRANSFER);
      expect(transfer.processed).to.be.false;
    });

    it("Should process delayed transfer after delay period", async function () {
      await bridge.lockTokens(LARGE_TRANSFER, "polygon", targetAddress);
      
      const transferId = ethers.utils.solidityKeccak256(
        ["address", "uint256", "string", "address"],
        [owner.address, LARGE_TRANSFER, "polygon", targetAddress]
      );
      
      await time.increase(DELAY_PERIOD);
      await bridge.processDelayedTransfer(transferId);
      
      const transfer = await bridge.pendingTransfers(transferId);
      expect(transfer.processed).to.be.true;
    });
  });

  describe("Gas Management", function () {
    it("Should enforce minimum gas requirement", async function () {
      const remoteBridge = ethers.Wallet.createRandom().address;
      await bridge.registerChain(REMOTE_CHAIN_ID, remoteBridge);
      
      const amount = ethers.utils.parseEther("100");
      await expect(
        bridge.lockTokens(amount, "polygon", addr1.address, { gasLimit: 50000 })
      ).to.be.revertedWith("Insufficient gas provided");
    });

    it("Should allow updating minimum gas requirement", async function () {
      const newMinGas = ethers.utils.parseEther("0.2");
      await bridge.setMinGasForTransfer(newMinGas);
      expect(await bridge.minGasForTransfer()).to.equal(newMinGas);
    });
  });

  describe("Security Features", function () {
    it("Should prevent processing same transaction hash twice", async function () {
      const txHash = ethers.utils.formatBytes32String("test");
      await bridge.processRemoteTransaction(txHash, addr1.address, 100);
      
      await expect(
        bridge.processRemoteTransaction(txHash, addr1.address, 100)
      ).to.be.revertedWith("Transaction already processed");
    });

    it("Should only allow owner to register chains", async function () {
      const remoteBridge = ethers.Wallet.createRandom().address;
      await expect(
        bridge.connect(addr1).registerChain(REMOTE_CHAIN_ID, remoteBridge)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});