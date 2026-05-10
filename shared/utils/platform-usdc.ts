import type { WalletAddress } from "../types/common";

export interface PlatformUsdcToken {
  chainId: number;
  address: WalletAddress;
  decimals: 6;
  name: string;
  symbol: "USDC";
  testnet?: boolean;
}

const platformUsdcTokens = [
  {
    chainId: 11155111,
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    name: "USDC Sepolia",
    symbol: "USDC",
    testnet: true,
  },
  {
    chainId: 84532,
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    name: "USDC Base Sepolia",
    symbol: "USDC",
    testnet: true,
  },
  {
    chainId: 11155420,
    address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    decimals: 6,
    name: "USDC OP Sepolia",
    symbol: "USDC",
    testnet: true,
  },
  {
    chainId: 421614,
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    decimals: 6,
    name: "USDC Arbitrum Sepolia",
    symbol: "USDC",
    testnet: true,
  },
  {
    chainId: 8453,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    name: "USDC Base",
    symbol: "USDC",
  },
  {
    chainId: 10,
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    name: "USDC Optimism",
    symbol: "USDC",
  },
  {
    chainId: 42161,
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    name: "USDC Arbitrum",
    symbol: "USDC",
  },
] as const satisfies readonly PlatformUsdcToken[];

export function getPlatformUsdcToken(
  chainId: number,
): PlatformUsdcToken | null {
  return platformUsdcTokens.find((token) => token.chainId === chainId) ?? null;
}

export function requirePlatformUsdcToken(chainId: number): PlatformUsdcToken {
  const token = getPlatformUsdcToken(chainId);
  if (!token) {
    throw new Error(`USDC is not configured for chain ${chainId}`);
  }
  return token;
}

