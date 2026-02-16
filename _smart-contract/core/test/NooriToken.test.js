const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("NooriToken", function () {
  let NooriToken;
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    NooriToken = await ethers.getContractFactory("NooriToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    token = await upgrades.deployProxy(NooriToken, [], { initializer: 'initialize' });
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should grant all roles to owner", async function () {
      const MINTER_ROLE = await token.MINTER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      const UPGRADER_ROLE = await token.UPGRADER_ROLE();
      const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE();
      const BRIDGE_ROLE = await token.BRIDGE_ROLE();
      const ADMIN_ROLE = await token.ADMIN_ROLE();

      expect(await token.hasRole(MINTER_ROLE, owner.address)).to.equal(true);
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.equal(true);
      expect(await token.hasRole(UPGRADER_ROLE, owner.address)).to.equal(true);
      expect(await token.hasRole(BLACKLISTER_ROLE, owner.address)).to.equal(true);
      expect(await token.hasRole(BRIDGE_ROLE, owner.address)).to.equal(true);
      expect(await token.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("100");
      await token.mint(addr1.address, mintAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should fail if non-minter tries to mint", async function () {
      const mintAmount = ethers.utils.parseEther("100");
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Blacklisting", function () {
    it("Should allow blacklister to blacklist address", async function () {
      await token.blacklist(addr1.address);
      expect(await token.blacklisted(addr1.address)).to.equal(true);
    });

    it("Should prevent blacklisted address from transferring", async function () {
      const amount = ethers.utils.parseEther("10");
      await token.mint(addr1.address, amount);
      await token.blacklist(addr1.address);
      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWith("Account is blacklisted");
    });
  });

  describe("Pausing", function () {
    it("Should allow pauser to pause", async function () {
      await token.pause();
      expect(await token.paused()).to.equal(true);
    });

    it("Should prevent transfers when paused", async function () {
      const amount = ethers.utils.parseEther("10");
      await token.mint(addr1.address, amount);
      await token.pause();
      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Upgradeability", function () {
    it("Should allow upgrader to upgrade", async function () {
      const NooriTokenV2 = await ethers.getContractFactory("NooriToken");
      await expect(upgrades.upgradeProxy(token.address, NooriTokenV2))
        .to.not.be.reverted;
    });

    it("Should fail if non-upgrader tries to upgrade", async function () {
      const NooriTokenV2 = await ethers.getContractFactory("NooriToken", addr1);
      await expect(
        upgrades.upgradeProxy(token.address, NooriTokenV2)
      ).to.be.reverted;
    });
  });
});