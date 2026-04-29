import { defineConfig } from "vitepress";

export default defineConfig({
    title: "useContent Documentation",
    description: "Engineering documentation portal for the useContent platform.",
    cleanUrls: true,
    vite: {
        build: {
            chunkSizeWarningLimit: 4000,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes("node_modules/mermaid")) {
                            return "mermaid";
                        }

                        return undefined;
                    },
                },
            },
        },
    },
    markdown: {
        config(md) {
            const defaultFence = md.renderer.rules.fence;

            md.renderer.rules.fence = (tokens, idx, options, env, self) => {
                const token = tokens[idx];
                const info = token.info.trim();

                if (info === "mermaid") {
                    return `<MermaidDiagram code="${encodeURIComponent(token.content)}" />`;
                }

                return defaultFence?.(tokens, idx, options, env, self) ?? "";
            };
        },
    },
    themeConfig: {
        nav: [
            { text: "Overview", link: "/overview/introduction" },
            { text: "Architecture", link: "/architecture/" },
            { text: "Data Model", link: "/data-model/" },
            { text: "Frontend", link: "/frontend/" },
            { text: "Backend", link: "/backend/" },
            { text: "Smart Contracts", link: "/smart-contracts/" },
            { text: "Testing", link: "/testing/" },
            { text: "Deployment", link: "/deployment/" },
            { text: "ADR", link: "/adr/" },
        ],
        sidebar: [
            {
                text: "Overview",
                items: [
                    { text: "Introduction", link: "/overview/introduction" },
                    { text: "Requirements", link: "/overview/requirements" },
                    { text: "Technology Stack", link: "/overview/technology-stack" },
                ],
            },
            {
                text: "Architecture",
                items: [
                    { text: "High-Level Architecture", link: "/architecture/" },
                    { text: "Core Flows", link: "/architecture/core-flows" },
                    { text: "Access Control", link: "/architecture/access-control" },
                    { text: "Content Delivery", link: "/architecture/content-delivery" },
                    { text: "Wallet Authentication", link: "/architecture/wallet-auth" },
                ],
            },
            {
                text: "Data Model",
                items: [{ text: "Domain Model", link: "/data-model/" }],
            },
            {
                text: "Implementation",
                items: [
                    { text: "Frontend", link: "/frontend/" },
                    { text: "Backend", link: "/backend/" },
                    { text: "Smart Contracts", link: "/smart-contracts/" },
                ],
            },
            {
                text: "Verification & Operations",
                items: [
                    { text: "Testing", link: "/testing/" },
                    { text: "Deployment", link: "/deployment/" },
                    { text: "Documentation Deployment", link: "/deployment/documentation" },
                ],
            },
            {
                text: "Architecture Decisions",
                items: [
                    { text: "ADR Index", link: "/adr/" },
                    { text: "ADR-001 MinIO over IPFS", link: "/adr/minio-over-ipfs" },
                    { text: "ADR-002 Backend Access Verification", link: "/adr/backend-access-verification" },
                    { text: "ADR-003 Signed URLs", link: "/adr/signed-urls" },
                    { text: "ADR-004 Shared Reader Manager", link: "/adr/shared-reader-manager" },
                    { text: "ADR-005 Platform Billing Manager", link: "/adr/platform-billing-manager" },
                    { text: "ADR-006 Static Docs Deployment", link: "/adr/static-docs-deployment" },
                ],
            },
        ],
        search: {
            provider: "local",
        },
        outline: {
            level: [2, 3],
        },
    },
});
