import { APIError } from "encore.dev/api";
import { Contract, Interface, JsonRpcProvider, isAddress } from "ethers";
import { subscriptionManagerAbi } from "../../contracts/abi/SubscriptionManager";

const managerInterface = new Interface(subscriptionManagerAbi);

interface VerifyPlanRegistrationInput {
  authorWallet: string;
  chainId: number;
  contractAddress: string;
  planKey: string;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  active: boolean;
  txHash: string;
}

interface VerifySubscriptionPaymentInput {
  subscriberWallet: string;
  chainId: number;
  contractAddress: string;
  planKey: string;
  tokenAddress: string;
  price: string;
  txHash: string;
}

export interface VerifiedSubscriptionPayment {
  paidUntil: Date;
}

export async function verifyPlanRegistration(
  input: VerifyPlanRegistrationInput,
): Promise<void> {
  const provider = getProvider(input.chainId);
  const contractAddress = normalizeAddress(input.contractAddress);
  const receipt = await getReceipt(provider, input.txHash);

  if (receipt.status !== 1) {
    throw APIError.failedPrecondition("plan registration transaction failed");
  }

  const event = receipt.logs
    .filter((log) => normalizeAddress(log.address) === contractAddress)
    .map((log) => tryParseLog(log))
    .find(
      (log) =>
        log &&
        (log.name === "PlanRegistered" || log.name === "PlanUpdated") &&
        normalizeBytes32(String(log.args.planKey)) === input.planKey,
    );

  if (!event) {
    throw APIError.failedPrecondition("plan registration event not found");
  }

  const manager = new Contract(
    contractAddress,
    subscriptionManagerAbi,
    provider,
  );
  const plan = await manager.plans(input.planKey);
  const periodSeconds = BigInt(input.billingPeriodDays) * 24n * 60n * 60n;

  if (normalizeAddress(plan.author) !== normalizeAddress(input.authorWallet)) {
    throw APIError.failedPrecondition(
      "on-chain plan author does not match wallet",
    );
  }
  if (normalizeAddress(plan.token) !== normalizeAddress(input.tokenAddress)) {
    throw APIError.failedPrecondition(
      "on-chain plan token does not match input",
    );
  }
  if (plan.price.toString() !== input.price) {
    throw APIError.failedPrecondition(
      "on-chain plan price does not match input",
    );
  }
  if (BigInt(plan.periodSeconds) !== periodSeconds) {
    throw APIError.failedPrecondition(
      "on-chain plan period does not match input",
    );
  }
  if (Boolean(plan.active) !== input.active) {
    throw APIError.failedPrecondition(
      "on-chain plan active state does not match input",
    );
  }
}

export async function verifySubscriptionPayment(
  input: VerifySubscriptionPaymentInput,
): Promise<VerifiedSubscriptionPayment> {
  const provider = getProvider(input.chainId);
  const contractAddress = normalizeAddress(input.contractAddress);
  const receipt = await getReceipt(provider, input.txHash);

  if (receipt.status !== 1) {
    throw APIError.failedPrecondition("subscription transaction failed");
  }

  const event = receipt.logs
    .filter((log) => normalizeAddress(log.address) === contractAddress)
    .map((log) => tryParseLog(log))
    .find(
      (log) =>
        log &&
        log.name === "SubscriptionPaid" &&
        normalizeBytes32(String(log.args.planKey)) === input.planKey,
    );

  if (!event) {
    throw APIError.failedPrecondition("subscription payment event not found");
  }

  if (
    normalizeAddress(event.args.subscriber) !==
    normalizeAddress(input.subscriberWallet)
  ) {
    throw APIError.failedPrecondition(
      "subscription event subscriber does not match wallet",
    );
  }
  if (
    normalizeAddress(event.args.token) !== normalizeAddress(input.tokenAddress)
  ) {
    throw APIError.failedPrecondition(
      "subscription event token does not match plan",
    );
  }
  if (event.args.amount.toString() !== input.price) {
    throw APIError.failedPrecondition(
      "subscription event amount does not match plan",
    );
  }

  return {
    paidUntil: new Date(Number(event.args.paidUntil) * 1000),
  };
}

function getProvider(chainId: number): JsonRpcProvider {
  const url =
    process.env[`RPC_URL_${chainId}`] ??
    (chainId === 11155111 ? process.env.SEPOLIA_RPC_URL : undefined);

  if (!url) {
    throw APIError.failedPrecondition(`RPC_URL_${chainId} is not configured`);
  }

  return new JsonRpcProvider(url, chainId);
}

async function getReceipt(provider: JsonRpcProvider, txHash: string) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw APIError.failedPrecondition("transaction receipt not found");
  }

  return receipt;
}

function tryParseLog(log: { topics: readonly string[]; data: string }) {
  try {
    return managerInterface.parseLog({
      topics: [...log.topics],
      data: log.data,
    });
  } catch {
    return null;
  }
}

function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw APIError.invalidArgument("invalid address");
  }

  return address.toLowerCase();
}

function normalizeBytes32(value: string): string {
  return value.toLowerCase();
}
