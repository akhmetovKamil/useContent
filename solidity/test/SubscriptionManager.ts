import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("SubscriptionManager", async () => {
  const { ethers } = await network.connect();

  async function deployFixture() {
    const [owner, treasury, author, subscriber, stranger] =
      await ethers.getSigners();
    const token = await ethers.deployContract("MockERC20");
    const manager = await ethers.deployContract("SubscriptionManager", [
      owner.address,
      treasury.address,
    ]);
    const planKey = ethers.id("author:main");
    const price = ethers.parseUnits("100", 18);
    const period = 30n * 24n * 60n * 60n;
    const erc20Payment = 0;
    const nativePayment = 1;

    await token.mint(subscriber.address, ethers.parseUnits("1000", 18));

    return {
      owner,
      treasury,
      author,
      subscriber,
      stranger,
      token,
      manager,
      planKey,
      price,
      period,
      erc20Payment,
      nativePayment,
    };
  }

  it("lets an author register a plan", async () => {
    const { author, token, manager, planKey, price, period, erc20Payment } =
      await deployFixture();

    await manager
      .connect(author)
      .registerPlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        ethers.ZeroHash,
      );

    const plan = await manager.plans(planKey);
    assert.equal(plan.author, author.address);
    assert.equal(plan.paymentAsset, BigInt(erc20Payment));
    assert.equal(plan.token, token.target);
    assert.equal(plan.price, price);
    assert.equal(plan.periodSeconds, period);
    assert.equal(plan.active, true);
  });

  it("prevents non-authors from updating a plan", async () => {
    const {
      author,
      stranger,
      token,
      manager,
      planKey,
      price,
      period,
      erc20Payment,
    } = await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        ethers.ZeroHash,
      );

    await assert.rejects(
      manager
        .connect(stranger)
        .updatePlan(
          planKey,
          erc20Payment,
          token.target,
          price,
          period,
          true,
          ethers.ZeroHash,
        ),
      /UnauthorizedPlanAuthor/,
    );
  });

  it("splits subscription payment between treasury and author", async () => {
    const {
      author,
      subscriber,
      treasury,
      token,
      manager,
      planKey,
      price,
      period,
      erc20Payment,
    } = await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        ethers.ZeroHash,
      );
    await token.connect(subscriber).approve(manager.target, price);

    await manager.connect(subscriber).subscribe(planKey);

    assert.equal(
      await token.balanceOf(treasury.address),
      ethers.parseUnits("20", 18),
    );
    assert.equal(
      await token.balanceOf(author.address),
      ethers.parseUnits("80", 18),
    );
  });

  it("extends active subscriptions from the current paidUntil", async () => {
    const {
      author,
      subscriber,
      token,
      manager,
      planKey,
      price,
      period,
      erc20Payment,
    } = await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        ethers.ZeroHash,
      );
    await token.connect(subscriber).approve(manager.target, price * 2n);

    await manager.connect(subscriber).subscribe(planKey);
    const firstPaidUntil = await manager.paidUntil(subscriber.address, planKey);
    await manager.connect(subscriber).subscribe(planKey);
    const secondPaidUntil = await manager.paidUntil(
      subscriber.address,
      planKey,
    );

    assert.equal(secondPaidUntil, firstPaidUntil + period);
  });

  it("rejects inactive plan payments", async () => {
    const {
      author,
      subscriber,
      token,
      manager,
      planKey,
      price,
      period,
      erc20Payment,
    } = await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        ethers.ZeroHash,
      );
    await manager
      .connect(author)
      .updatePlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        false,
        ethers.ZeroHash,
      );
    await token.connect(subscriber).approve(manager.target, price);

    await assert.rejects(
      manager.connect(subscriber).subscribe(planKey),
      /PlanInactive/,
    );
  });

  it("splits native subscription payment between treasury and author", async () => {
    const {
      author,
      subscriber,
      treasury,
      manager,
      planKey,
      price,
      period,
      nativePayment,
    } = await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        nativePayment,
        ethers.ZeroAddress,
        price,
        period,
        ethers.ZeroHash,
      );
    const treasuryBefore = await ethers.provider.getBalance(treasury.address);
    const authorBefore = await ethers.provider.getBalance(author.address);

    await manager.connect(subscriber).subscribe(planKey, { value: price });

    assert.equal(
      (await ethers.provider.getBalance(treasury.address)) - treasuryBefore,
      ethers.parseUnits("20", 18),
    );
    assert.equal(
      (await ethers.provider.getBalance(author.address)) - authorBefore,
      ethers.parseUnits("80", 18),
    );
  });

  it("rejects native payments with a wrong value", async () => {
    const { author, subscriber, manager, planKey, price, period, nativePayment } =
      await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        nativePayment,
        ethers.ZeroAddress,
        price,
        period,
        ethers.ZeroHash,
      );

    await assert.rejects(
      manager.connect(subscriber).subscribe(planKey, { value: price - 1n }),
      /InvalidNativeValue/,
    );
  });

  it("rejects native value for ERC-20 payments", async () => {
    const { author, subscriber, token, manager, planKey, price, period, erc20Payment } =
      await deployFixture();
    await manager
      .connect(author)
      .registerPlan(
        planKey,
        erc20Payment,
        token.target,
        price,
        period,
        ethers.ZeroHash,
      );
    await token.connect(subscriber).approve(manager.target, price);

    await assert.rejects(
      manager.connect(subscriber).subscribe(planKey, { value: 1n }),
      /UnexpectedNativeValue/,
    );
  });

  it("lets owner update treasury and bounded fee", async () => {
    const { owner, stranger, manager } = await deployFixture();

    await manager.connect(owner).setPlatformTreasury(stranger.address);
    await manager.connect(owner).setPlatformFeeBps(2500);

    assert.equal(await manager.platformTreasury(), stranger.address);
    assert.equal(await manager.platformFeeBps(), 2500n);
    await assert.rejects(
      manager.connect(owner).setPlatformFeeBps(3001),
      /FeeTooHigh/,
    );
    await assert.rejects(
      manager.connect(stranger).setPlatformFeeBps(100),
      /OwnableUnauthorizedAccount/,
    );
  });
});
