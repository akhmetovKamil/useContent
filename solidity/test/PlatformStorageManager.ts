import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { deployMockErc20 } from "./helpers/mock-erc20";

describe("PlatformStorageManager", async () => {
  const { ethers } = await network.connect();

  async function deployFixture() {
    const [owner, treasury, author, stranger] = await ethers.getSigners();
    const token = await deployMockErc20(ethers);
    const pricePerGb = ethers.parseUnits("1", 6);
    const period = 30n * 24n * 60n * 60n;
    const manager = await ethers.deployContract("PlatformStorageManager", [
      owner.address,
      treasury.address,
      token.target,
      pricePerGb,
      10,
      period,
    ]);

    await token.mint(author.address, ethers.parseUnits("100", 6));

    return { owner, treasury, author, stranger, token, manager, pricePerGb, period };
  }

  it("charges selected extra storage only", async () => {
    const { author, treasury, token, manager, pricePerGb } = await deployFixture();
    const amount = 4n * pricePerGb;
    await token.connect(author).approve(manager.target, amount);

    await manager.connect(author).subscribeStorage(4);

    assert.equal(await token.balanceOf(treasury.address), amount);
    assert.equal(await manager.extraStorageGb(author.address), 4n);
  });

  it("extends active storage subscriptions from current paidUntil", async () => {
    const { author, token, manager, pricePerGb, period } = await deployFixture();
    await token.connect(author).approve(manager.target, 2n * pricePerGb);

    await manager.connect(author).subscribeStorage(1);
    const firstPaidUntil = await manager.paidUntil(author.address);
    await manager.connect(author).subscribeStorage(1);
    const secondPaidUntil = await manager.paidUntil(author.address);

    assert.equal(secondPaidUntil, firstPaidUntil + period);
  });

  it("rejects zero storage, too much storage, and inactive storage plan", async () => {
    const { author, token, manager, pricePerGb, period } = await deployFixture();
    await token.connect(author).approve(manager.target, 11n * pricePerGb);

    await assert.rejects(manager.connect(author).subscribeStorage(0), /InvalidStorageAmount/);
    await assert.rejects(manager.connect(author).subscribeStorage(11), /InvalidStorageAmount/);

    await manager.updateStoragePlan(pricePerGb, 10, period, false);
    await assert.rejects(manager.connect(author).subscribeStorage(1), /StorageInactive/);
  });

  it("lets owner update storage plan, treasury, and token", async () => {
    const { owner, stranger, manager, pricePerGb } = await deployFixture();
    const nextToken = await deployMockErc20(ethers);

    await manager.connect(owner).updateStoragePlan(pricePerGb * 2n, 20, 60n, true);
    await manager.connect(owner).setPlatformTreasury(stranger.address);
    await manager.connect(owner).setPaymentToken(nextToken.target);

    assert.equal(await manager.pricePerGb(), pricePerGb * 2n);
    assert.equal(await manager.maxExtraStorageGb(), 20n);
    assert.equal(await manager.platformTreasury(), stranger.address);
    assert.equal(await manager.paymentToken(), nextToken.target);
    await assert.rejects(
      manager.connect(stranger).updateStoragePlan(pricePerGb, 10, 60n, true),
      /OwnableUnauthorizedAccount/,
    );
  });
});
