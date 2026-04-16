export const authorTags = [
    "engineer",
    "designer",
    "founder",
    "researcher",
    "artist",
    "developer",
    "music",
    "education",
    "travel",
    "crypto",
    "writing",
    "video",
]

export const authorFaq = [
    {
        question: "What fee does the platform take?",
        answer: "The current on-chain subscription manager sends 20% to the platform treasury and 80% directly to the author wallet. Network gas is paid by the wallet that sends the transaction.",
    },
    {
        question: "Can I publish free and paid content together?",
        answer: "Yes. Posts and projects can use reusable access policies, so you can keep some content public and gate other content by subscription or token ownership.",
    },
    {
        question: "Do subscribers pay with a platform wallet?",
        answer: "No. The first version uses the subscriber's own connected wallet. ERC-20 subscriptions use approve plus subscribe, while native payments are paid directly in the chain token.",
    },
    {
        question: "Can I change my subscription later?",
        answer: "Yes. Authors can update plan title, price, period, network/token settings, and access policies. Existing paid periods stay stored as entitlements until they expire.",
    },
    {
        question: "Where are files stored?",
        answer: "Content files are stored through the backend object storage layer, currently targeting server-side storage instead of putting files directly on-chain.",
    },
]

export const authorHighlights = [
    "Wallet-native identity",
    "Reusable access policies",
    "Posts, projects, and gated files",
    "ERC-20 and native token subscriptions",
]
