import { defineConfig } from "vitepress";

export default defineConfig({
    title: "useContent Documentation",
    description: "Engineering documentation portal for the useContent platform.",
    head: [["meta", { name: "theme-color", content: "#0f766e" }]],
    cleanUrls: true,
    outDir: "dist",
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
        logo: "/logo-mark.svg",
        siteTitle: "useContent",
        nav: [
            { text: "Start", link: "/overview/introduction" },
            {
                text: "System",
                items: [
                    { text: "Architecture", link: "/architecture/" },
                    { text: "Core Flows", link: "/architecture/core-flows" },
                    { text: "Data Model", link: "/data-model/" },
                ],
            },
            {
                text: "Engineering",
                items: [
                    { text: "Frontend", link: "/frontend/" },
                    { text: "Backend", link: "/backend/" },
                    { text: "Smart Contracts", link: "/smart-contracts/" },
                ],
            },
            {
                text: "Operations",
                items: [
                    { text: "Testing", link: "/testing/" },
                    { text: "Deployment", link: "/deployment/" },
                    { text: "ADR", link: "/adr/" },
                ],
            },
        ],
        sidebar: [
            {
                text: "01. Product Context",
                collapsed: false,
                items: [
                    { text: "Introduction", link: "/overview/introduction" },
                    { text: "Requirements", link: "/overview/requirements" },
                    { text: "Technology Stack", link: "/overview/technology-stack" },
                ],
            },
            {
                text: "02. System Architecture",
                collapsed: false,
                items: [
                    { text: "High-Level Architecture", link: "/architecture/" },
                    { text: "Core Flows", link: "/architecture/core-flows" },
                    { text: "Access Control", link: "/architecture/access-control" },
                    { text: "Content Delivery", link: "/architecture/content-delivery" },
                    { text: "Wallet Authentication", link: "/architecture/wallet-auth" },
                ],
            },
            {
                text: "03. Data & Storage",
                collapsed: false,
                items: [{ text: "Domain Model", link: "/data-model/" }],
            },
            {
                text: "04. Implementation",
                collapsed: false,
                items: [
                    { text: "Frontend", link: "/frontend/" },
                    { text: "Frontend Data Flow", link: "/frontend/data-flow" },
                    { text: "Backend", link: "/backend/" },
                    { text: "Backend Operations", link: "/backend/operations" },
                    { text: "Smart Contracts", link: "/smart-contracts/" },
                ],
            },
            {
                text: "05. Verification & Deployment",
                collapsed: false,
                items: [
                    { text: "Testing", link: "/testing/" },
                    { text: "Deployment", link: "/deployment/" },
                    { text: "Runtime Environments", link: "/deployment/environments" },
                    { text: "Documentation Deployment", link: "/deployment/documentation" },
                ],
            },
            {
                text: "06. Architecture Decisions",
                collapsed: true,
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
