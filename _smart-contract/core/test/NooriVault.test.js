const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NooriVault", function () {
  let NooriToken;
  let NooriVault;
  let token;
  let vault;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let kycService;

  const ONE_DAY = 86400;
  const APR = 1000; // 10%
  const WITHDRAWAL_FEE = 50; // 0.5%
  const TRANSFER_FEE = 10; // 0.1%
  const LTV_RATIO = 6000; // 60%

  beforeEach(async function () {
    NooriToken = await ethers.getContractFactory("NooriToken");
    NooriVault = await ethers.getContractFactory("NooriBankVault");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token = await upgrades.deployProxy(NooriToken, [], { initializer: 'initialize' });
    await token.deployed();

    kycService = await deployMockKYCService();
    
    vault = await upgrades.deployProxy(NooriVault, [
      token.address,
      kycService.address
    ], { initializer: 'initialize' });
    await vault.deployed();

    // Setup roles and permissions
    await token.grantRole(await token.MINTER_ROLE(), vault.address);
    await vault.grantRole(await vault.ADMIN_ROLE(), owner.address);
  });

  describe("Account Management", function () {
    it("Should create account with unique ID", async function () {
      await vault.connect(addr1).createAccount("password123", "recovery123");
      const account = await vault.getAccount(addr1.address);
      expect(account.id).to.be.gt(0);
      expect(account.wallet).to.equal(addr1.address);
    });

    it("Should require unique memo for deposits", async function () {
      await vault.connect(addr1).createAccount("password123", "recovery123");
      const memo = "test-memo";
      await vault.connect(addr1).addMemo(memo);
      expect(await vault.getMemoOwner(memo)).to.equal(addr1.address);
    });
  });

  describe("Savings Features", function () {
    beforeEach(async function () {
      await vault.connect(addr1).createAccount("password123", "recovery123");
      await token.mint(addr1.address, ethers.utils.parseEther("1000"));
      await token.connect(addr1).approve(vault.address, ethers.utils.parseEther("1000"));
    });

    it("Should accrue interest daily", async function () {
      const depositAmount = ethers.utils.parseEther("100");
      await vault.connect(addr1).deposit(depositAmount);
      
      await time.increase(ONE_DAY);
      await vault.updateInterest(addr1.address);

      const expectedInterest = depositAmount.mul(APR).div(36500); // Daily interest
      const balance = await vault.getBalance(addr1.address, token.address);
      expect(balance).to.be.closeTo(depositAmount.add(expectedInterest), ethers.utils.parseEther("0.0001"));
    });

    it("Should compound interest correctly", async function () {
      const depositAmount = ethers.utils.parseEther("100");
      await vault.connect(addr1).deposit(depositAmount);
      
      await time.increase(ONE_DAY * 7); // 1 week
      await vault.updateInterest(addr1.address);

      // Calculate 7 days of compound interest
      let expected = depositAmount;
      for(let i = 0; i < 7; i++) {
        expected = expected.add(expected.mul(APR).div(36500));
      }
      
      const balance = await vault.getBalance(addr1.address, token.address);
      expect(balance).to.be.closeTo(expected, ethers.utils.parseEther("0.0001"));
    });
  });

  describe("Lending System", function () {
    beforeEach(async function () {
      await vault.connect(addr1).createAccount("password123", "recovery123");
      await vault.connect(addr2).createAccount("password123", "recovery123");
      
      // Fund accounts
      await token.mint(addr1.address, ethers.utils.parseEther("1000"));
      await token.connect(addr1).approve(vault.address, ethers.utils.parseEther("1000"));
      await vault.connect(addr1).deposit(ethers.utils.parseEther("1000"));
    });

    it("Should allow collateralized borrowing up to 60% LTV", async function () {
      const collateralAmount = ethers.utils.parseEther("100");
      const maxBorrowAmount = collateralAmount.mul(LTV_RATIO).div(10000);

      await vault.connect(addr2).depositCollateral({ value: collateralAmount });
      await vault.connect(addr2).borrow(maxBorrowAmount);

      const loan = await vault.getLoan(addr2.address);
      expect(loan.amount).to.equal(maxBorrowAmount);
      expect(loan.collateral).to.equal(collateralAmount);
    });

    it("Should liquidate when collateral ratio falls below threshold", async function () {
      const collateralAmount = ethers.utils.parseEther("100");
      const borrowAmount = collateralAmount.mul(LTV_RATIO).div(10000);

      await vault.connect(addr2).depositCollateral({ value: collateralAmount });
      await vault.connect(addr2).borrow(borrowAmount);

      // Simulate ETH price drop by 50%
      await vault.updateCollateralPrice(ethers.utils.parseEther("0.5")); // Price feed mock
      
      await vault.checkLiquidation(addr2.address);
      const loan = await vault.getLoan(addr2.address);
      expect(loan.liquidated).to.be.true;
    });
  });

  describe("Transaction Management", function () {
    beforeEach(async function () {
      await vault.connect(addr1).createAccount("password123", "recovery123");
      await vault.connect(addr2).createAccount("password123", "recovery123");
      await token.mint(addr1.address, ethers.utils.parseEther("1000"));
      await token.connect(addr1).approve(vault.address, ethers.utils.parseEther("1000"));
      await vault.connect(addr1).deposit(ethers.utils.parseEther("1000"));
    });

    it("Should apply correct transfer fee", async function () {
      const amount = ethers.utils.parseEther("100");
      const fee = amount.mul(TRANSFER_FEE).div(10000);
      
      await vault.connect(addr1).transfer(addr2.address, amount);
      
      const senderBalance = await vault.getBalance(addr1.address, token.address);
      const receiverBalance = await vault.getBalance(addr2.address, token.address);
      const vaultFees = await vault.collectedFees(token.address);

      expect(senderBalance).to.equal(ethers.utils.parseEther("900").sub(fee));
      expect(receiverBalance).to.equal(amount);
      expect(vaultFees).to.equal(fee);
    });

    it("Should apply correct withdrawal fee", async function () {
      const amount = ethers.utils.parseEther("100");
      const fee = amount.mul(WITHDRAWAL_FEE).div(10000);
      
      await vault.connect(addr1).withdraw(amount);
      
      const balance = await vault.getBalance(addr1.address, token.address);
      const vaultFees = await vault.collectedFees(token.address);
      
      expect(balance).to.equal(ethers.utils.parseEther("900"));
      expect(vaultFees).to.equal(fee);
    });

    it("Should not charge fee on deposits", async function () {
      const amount = ethers.utils.parseEther("100");
      await token.mint(addr2.address, amount);
      await token.connect(addr2).approve(vault.address, amount);
      
      await vault.connect(addr2).deposit(amount);
      
      const balance = await vault.getBalance(addr2.address, token.address);
      expect(balance).to.equal(amount);
    });
  });
});

async function deployMockKYCService() {
  const MockKYC = await ethers.getContractFactory("MockKYCService");
  const mockKyc = await MockKYC.deploy();
  await mockKyc.deployed();
  return mockKyc;
}