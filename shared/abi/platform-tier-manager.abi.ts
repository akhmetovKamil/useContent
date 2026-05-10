export const platformTierManagerAbi = [
  {
    type: "function",
    name: "paymentToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "subscribe",
    stateMutability: "nonpayable",
    inputs: [{ name: "tierKey", type: "bytes32" }],
    outputs: [{ name: "nextPaidUntil", type: "uint256" }],
  },
  {
    type: "event",
    name: "PlatformTierPaid",
    inputs: [
      { name: "author", type: "address", indexed: true },
      { name: "tierKey", type: "bytes32", indexed: true },
      { name: "baseStorageGb", type: "uint16", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "paidUntil", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TierRegistered",
    inputs: [
      { name: "tierKey", type: "bytes32", indexed: true },
      { name: "price", type: "uint256", indexed: false },
      { name: "baseStorageGb", type: "uint16", indexed: false },
      { name: "periodSeconds", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TierUpdated",
    inputs: [
      { name: "tierKey", type: "bytes32", indexed: true },
      { name: "price", type: "uint256", indexed: false },
      { name: "baseStorageGb", type: "uint16", indexed: false },
      { name: "periodSeconds", type: "uint64", indexed: false },
      { name: "active", type: "bool", indexed: false },
    ],
  },
] as const;
