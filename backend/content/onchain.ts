import { APIError } from "encore.dev/api";
import { Contract, Interface, JsonRpcProvider, isAddress } from "ethers";
import { platformSubscriptionManagerAbi } from "../../contracts/abi/PlatformSubscriptionManager";
import { subscriptionManagerAbi } from "../../contracts/abi/SubscriptionManager";
import type { AccessPolicy, AccessPolicyNode } from "../domain/access";

const managerInterface = new Interface(subscriptionManagerAbi);
const platformManagerInterface = new Interface(platformSubscriptionManagerAbi);
const legacyManagerAbi = [
  "event PlanRegistered(bytes32 indexed planKey,address indexed author,address indexed token,uint256 price,uint64 periodSeconds,bytes32 externalId)",
  "event PlanUpdated(bytes32 indexed planKey,address indexed author,address indexed token,uint256 price,uint64 periodSeconds,bool active,bytes32 externalId)",
  "event SubscriptionPaid(bytes32 indexed planKey,address indexed subscriber,address indexed author,address token,uint256 amount,uint256 platformFee,uint256 paidUntil)",
  "function plans(bytes32 planKey) view returns (address author,address token,uint256 price,uint64 periodSeconds,bool active,bytes32 externalId)",
] as const;
const legacyManagerInterface = new Interface(legacyManagerAbi);
const erc20ReadAbi = [
  "function balanceOf(address account) view returns (uint256)",
] as const;
const erc721ReadAbi = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;
const erc1155ReadAbi = [
  "function balanceOf(address account,uint256 id) view returns (uint256)",
] as const;
const PAYMENT_ASSET_CODE = {
  erc20: 0,
  native: 1,
} as const;

interface VerifyPlanRegistrationInput {
  authorWallet: string;
  chainId: number;
  contractAddress: string;
  planKey: string;
  paymentAsset: "erc20" | "native";
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
  paymentAsset: "erc20" | "native";
  tokenAddress: string;
  price: string;
  txHash: string;
}

export interface VerifiedSubscriptionPayment {
  paidUntil: Date;
}

interface VerifyPlatformSubscriptionPaymentInput {
  authorWallet: string;
  chainId: number;
  contractAddress: string;
  tierKey: string;
  extraStorageGb: number;
  tokenAddress: string;
  amount: string;
  txHash: string;
}

export interface VerifiedPlatformSubscriptionPayment {
  paidUntil: Date;
}

export interface OnChainAccessGrants {
  tokenBalances: Array<{
    chainId: number;
    contractAddress: string;
    balance: string;
  }>;
  nftOwnerships: Array<{
    chainId: number;
    contractAddress: string;
    standard: "erc721" | "erc1155";
    tokenId?: string;
    balance?: string;
  }>;
}

export async function readOnChainAccessGrants(
  policy: AccessPolicy,
  viewerWallet?: string,
): Promise<OnChainAccessGrants> {
  if (!viewerWallet) {
    return { tokenBalances: [], nftOwnerships: [] };
  }

  let wallet: string;
  try {
    wallet = normalizeAddress(viewerWallet);
  } catch {
    return { tokenBalances: [], nftOwnerships: [] };
  }

  const requirements = collectOnChainRequirements(policy.root);
  const tokenBalances = (
    await Promise.all(
      [...requirements.tokenBalances.values()].map((requirement) =>
        readTokenBalanceGrant(wallet, requirement),
      ),
    )
  ).filter((grant): grant is OnChainAccessGrants["tokenBalances"][number] =>
    Boolean(grant),
  );
  const nftOwnerships = (
    await Promise.all(
      [...requirements.nftOwnerships.values()].map((requirement) =>
        readNftOwnershipGrant(wallet, requirement),
      ),
    )
  ).filter((grant): grant is OnChainAccessGrants["nftOwnerships"][number] =>
    Boolean(grant),
  );

  return { tokenBalances, nftOwnerships };
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
    .map((log) => tryParseManagerLog(log))
    .find(
      (log) =>
        log &&
        (log.name === "PlanRegistered" || log.name === "PlanUpdated") &&
        normalizeBytes32(String(log.args.planKey)) === input.planKey,
    );

  if (!event) {
    throw APIError.failedPrecondition("plan registration event not found");
  }

  const plan = await readPlan(provider, contractAddress, input.planKey);
  const periodSeconds = BigInt(input.billingPeriodDays) * 24n * 60n * 60n;

  if (normalizeAddress(plan.author) !== normalizeAddress(input.authorWallet)) {
    throw APIError.failedPrecondition(
      "on-chain plan author does not match wallet",
    );
  }
  if (plan.isLegacy && input.paymentAsset === "native") {
    throw APIError.failedPrecondition(
      "deployed subscription manager does not support native payments",
    );
  }
  if (
    !plan.isLegacy &&
    Number(plan.paymentAsset) !== PAYMENT_ASSET_CODE[input.paymentAsset]
  ) {
    throw APIError.failedPrecondition(
      "on-chain plan payment asset does not match input",
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
    .map((log) => tryParseManagerLog(log))
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
  const eventPaymentAsset =
    "paymentAsset" in event.args ? Number(event.args.paymentAsset) : 0;
  if (eventPaymentAsset !== PAYMENT_ASSET_CODE[input.paymentAsset]) {
    throw APIError.failedPrecondition(
      "subscription event payment asset does not match plan",
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

export async function verifyPlatformSubscriptionPayment(
  input: VerifyPlatformSubscriptionPaymentInput,
): Promise<VerifiedPlatformSubscriptionPayment> {
  const provider = getProvider(input.chainId);
  const contractAddress = normalizeAddress(input.contractAddress);
  const receipt = await getReceipt(provider, input.txHash);

  if (receipt.status !== 1) {
    throw APIError.failedPrecondition(
      "platform subscription transaction failed",
    );
  }
  const manager = new Contract(
    contractAddress,
    platformSubscriptionManagerAbi,
    provider,
  );
  const paymentToken = await manager.paymentToken();
  if (normalizeAddress(paymentToken) !== normalizeAddress(input.tokenAddress)) {
    throw APIError.failedPrecondition(
      "platform subscription manager token does not match intent",
    );
  }

  const event = receipt.logs
    .filter((log) => normalizeAddress(log.address) === contractAddress)
    .map((log) => tryParsePlatformManagerLog(log))
    .find(
      (log) =>
        log &&
        log.name === "PlatformSubscriptionPaid" &&
        normalizeBytes32(String(log.args.tierKey)) === input.tierKey,
    );

  if (!event) {
    throw APIError.failedPrecondition(
      "platform subscription payment event not found",
    );
  }

  if (
    normalizeAddress(event.args.author) !== normalizeAddress(input.authorWallet)
  ) {
    throw APIError.failedPrecondition(
      "platform subscription event author does not match wallet",
    );
  }
  if (Number(event.args.extraStorageGb) !== input.extraStorageGb) {
    throw APIError.failedPrecondition(
      "platform subscription event extra storage does not match intent",
    );
  }
  if (event.args.amount.toString() !== input.amount) {
    throw APIError.failedPrecondition(
      "platform subscription event amount does not match intent",
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

function collectOnChainRequirements(node: AccessPolicyNode): {
  tokenBalances: Map<string, { chainId: number; contractAddress: string }>;
  nftOwnerships: Map<
    string,
    {
      chainId: number;
      contractAddress: string;
      standard: "erc721" | "erc1155";
      tokenId?: string;
    }
  >;
} {
  const tokenBalances = new Map<
    string,
    { chainId: number; contractAddress: string }
  >();
  const nftOwnerships = new Map<
    string,
    {
      chainId: number;
      contractAddress: string;
      standard: "erc721" | "erc1155";
      tokenId?: string;
    }
  >();

  function visit(current: AccessPolicyNode) {
    if (current.type === "token_balance") {
      const contractAddress = tryNormalizeAddress(current.contractAddress);
      if (!contractAddress) {
        return;
      }
      tokenBalances.set(`${current.chainId}:${contractAddress}`, {
        chainId: current.chainId,
        contractAddress,
      });
      return;
    }

    if (current.type === "nft_ownership") {
      const contractAddress = tryNormalizeAddress(current.contractAddress);
      if (!contractAddress) {
        return;
      }
      nftOwnerships.set(
        `${current.chainId}:${contractAddress}:${current.standard}:${
          current.tokenId ?? ""
        }`,
        {
          chainId: current.chainId,
          contractAddress,
          standard: current.standard,
          tokenId: current.tokenId,
        },
      );
      return;
    }

    if (current.type === "and" || current.type === "or") {
      for (const child of current.children) {
        visit(child);
      }
    }
  }

  visit(node);
  return { tokenBalances, nftOwnerships };
}

async function readTokenBalanceGrant(
  wallet: string,
  requirement: { chainId: number; contractAddress: string },
): Promise<OnChainAccessGrants["tokenBalances"][number] | null> {
  try {
    const token = new Contract(
      requirement.contractAddress,
      erc20ReadAbi,
      getProvider(requirement.chainId),
    );
    const balance = await token.balanceOf(wallet);
    return {
      chainId: requirement.chainId,
      contractAddress: requirement.contractAddress,
      balance: balance.toString(),
    };
  } catch {
    return null;
  }
}

async function readNftOwnershipGrant(
  wallet: string,
  requirement: {
    chainId: number;
    contractAddress: string;
    standard: "erc721" | "erc1155";
    tokenId?: string;
  },
): Promise<OnChainAccessGrants["nftOwnerships"][number] | null> {
  try {
    if (requirement.standard === "erc721") {
      const nft = new Contract(
        requirement.contractAddress,
        erc721ReadAbi,
        getProvider(requirement.chainId),
      );

      if (requirement.tokenId) {
        const owner = await nft.ownerOf(requirement.tokenId);
        return {
          chainId: requirement.chainId,
          contractAddress: requirement.contractAddress,
          standard: requirement.standard,
          tokenId: requirement.tokenId,
          balance: normalizeAddress(owner) === wallet ? "1" : "0",
        };
      }

      const balance = await nft.balanceOf(wallet);
      return {
        chainId: requirement.chainId,
        contractAddress: requirement.contractAddress,
        standard: requirement.standard,
        balance: balance.toString(),
      };
    }

    if (!requirement.tokenId) {
      return null;
    }

    const nft = new Contract(
      requirement.contractAddress,
      erc1155ReadAbi,
      getProvider(requirement.chainId),
    );
    const balance = await nft.balanceOf(wallet, requirement.tokenId);
    return {
      chainId: requirement.chainId,
      contractAddress: requirement.contractAddress,
      standard: requirement.standard,
      tokenId: requirement.tokenId,
      balance: balance.toString(),
    };
  } catch {
    return null;
  }
}

async function getReceipt(provider: JsonRpcProvider, txHash: string) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw APIError.failedPrecondition("transaction receipt not found");
  }

  return receipt;
}

async function readPlan(
  provider: JsonRpcProvider,
  contractAddress: string,
  planKey: string,
) {
  const manager = new Contract(
    contractAddress,
    subscriptionManagerAbi,
    provider,
  );
  try {
    const plan = await manager.plans(planKey);
    return {
      isLegacy: false,
      author: plan.author,
      paymentAsset: plan.paymentAsset,
      token: plan.token,
      price: plan.price,
      periodSeconds: plan.periodSeconds,
      active: plan.active,
    };
  } catch (error) {
    if (!isOutOfBoundsDecodeError(error)) {
      throw error;
    }

    const legacyManager = new Contract(
      contractAddress,
      legacyManagerAbi,
      provider,
    );
    const plan = await legacyManager.plans(planKey);
    return {
      isLegacy: true,
      author: plan.author,
      paymentAsset: 0,
      token: plan.token,
      price: plan.price,
      periodSeconds: plan.periodSeconds,
      active: plan.active,
    };
  }
}

function tryParseManagerLog(log: { topics: readonly string[]; data: string }) {
  try {
    return managerInterface.parseLog({
      topics: [...log.topics],
      data: log.data,
    });
  } catch {
    try {
      return legacyManagerInterface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
    } catch {
      return null;
    }
  }
}

function tryParsePlatformManagerLog(log: {
  topics: readonly string[];
  data: string;
}) {
  try {
    return platformManagerInterface.parseLog({
      topics: [...log.topics],
      data: log.data,
    });
  } catch {
    return null;
  }
}

function isOutOfBoundsDecodeError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("out of bounds");
}

function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw APIError.invalidArgument("invalid address");
  }

  return address.toLowerCase();
}

function tryNormalizeAddress(address: string): string | null {
  return isAddress(address) ? address.toLowerCase() : null;
}

function normalizeBytes32(value: string): string {
  return value.toLowerCase();
}
