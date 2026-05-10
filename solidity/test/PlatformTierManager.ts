import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { deployMockErc20 } from "./helpers/mock-erc20";

describe("PlatformTierManager", async () => {
  const { ethers } = await network.connect();

  async function deployFixture() {
    const [owner, treasury, author, stranger] = await ethers.getSigners();
    const token = await deployMockErc20(ethers);
    const manager = await ethers.deployContract("PlatformTierManager", [
      owner.address,
      treasury.address,
      token.target,
    ]);
    const tierKey = ethers.id("platform:basic");
    const price = ethers.parseUnits("5", 6);
    const period = 30n * 24n * 60n * 60n;

    await token.mint(author.address, ethers.parseUnits("100", 6));

    return { owner, treasury, author, stranger, token, manager, tierKey, price, period };
  }

  it("lets owner register a tier", async () => {
    const { manager, tierKey, price, period } = await deployFixture();

    await manager.registerTier(tierKey, price, 3, period);

    const tier = await manager.tiers(tierKey);
    assert.equal(tier.price, price);
    assert.equal(tier.baseStorageGb, 3n);
    assert.equal(tier.periodSeconds, period);
    assert.equal(tier.active, true);
  });

  it("prevents non-owner tier updates", async () => {
    const { manager, stranger, tierKey, price, period } = await deployFixture();
    await manager.registerTier(tierKey, price, 3, period);

    await assert.rejects(
      manager.connect(stranger).updateTier(tierKey, price, 3, period, true),
      /OwnableUnauthorizedAccount/,
    );
  });

  it("charges only the tier price", async () => {
    const { author, treasury, token, manager, tierKey, price, period } =
      await deployFixture();
    await manager.registerTier(tierKey, price, 3, period);
    await token.connect(author).approve(manager.target, price);

    await manager.connect(author).subscribe(tierKey);

    assert.equal(await token.balanceOf(treasury.address), price);
  });

  it("extends active subscriptions from the current paidUntil", async () => {
    const { author, token, manager, tierKey, price, period } = await deployFixture();
    await manager.registerTier(tierKey, price, 3, period);
    await token.connect(author).approve(manager.target, price * 2n);

    await manager.connect(author).subscribe(tierKey);
    const firstPaidUntil = await manager.paidUntil(author.address, tierKey);
    await manager.connect(author).subscribe(tierKey);
    const secondPaidUntil = await manager.paidUntil(author.address, tierKey);

    assert.equal(secondPaidUntil, firstPaidUntil + period);
  });

  it("rejects inactive tiers", async () => {
    const { author, token, manager, tierKey, price, period } = await deployFixture();
    await manager.registerTier(tierKey, price, 3, period);
    await manager.updateTier(tierKey, price, 3, period, false);
    await token.connect(author).approve(manager.target, price);

    await assert.rejects(manager.connect(author).subscribe(tierKey), /TierInactive/);
  });

  it("lets owner update treasury and payment token", async () => {
    const { owner, stranger, token, manager } = await deployFixture();
    const nextToken = await deployMockErc20(ethers);

    await manager.connect(owner).setPlatformTreasury(stranger.address);
    await manager.connect(owner).setPaymentToken(nextToken.target);

    assert.equal(await manager.platformTreasury(), stranger.address);
    assert.equal(await manager.paymentToken(), nextToken.target);
    await assert.rejects(
      manager.connect(stranger).setPlatformTreasury(stranger.address),
      /OwnableUnauthorizedAccount/,
    );
    await assert.rejects(
      manager.connect(owner).setPaymentToken(ethers.ZeroAddress),
      /InvalidAddress/,
    );
    assert.equal(await token.balanceOf(stranger.address), 0n);
  });
});
