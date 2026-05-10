export const platformStorageManagerAbi = [
  {
    type: "function",
    name: "paymentToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "subscribeStorage",
    stateMutability: "nonpayable",
    inputs: [{ name: "selectedExtraStorageGb", type: "uint16" }],
    outputs: [{ name: "nextPaidUntil", type: "uint256" }],
  },
  {
    type: "event",
    name: "PlatformStoragePaid",
    inputs: [
      { name: "author", type: "address", indexed: true },
      { name: "extraStorageGb", type: "uint16", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "paidUntil", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "StoragePlanUpdated",
    inputs: [
      { name: "pricePerGb", type: "uint256", indexed: false },
      { name: "maxExtraStorageGb", type: "uint16", indexed: false },
      { name: "periodSeconds", type: "uint64", indexed: false },
      { name: "active", type: "bool", indexed: false },
    ],
  },
] as const;
