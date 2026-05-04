import { defineConfig } from "vitepress";

export default defineConfig({
    title: "Docs useContent",
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
            { text: "Home", link: "/" },
            { text: "Overview", link: "/overview/introduction" },
            {
                text: "Architecture",
                items: [
                    { text: "Architecture", link: "/architecture/" },
                    { text: "Runtime Flows", link: "/flows/" },
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
                text: "01. Overview",
                collapsed: false,
                items: [
                    { text: "Introduction", link: "/overview/introduction" },
                    { text: "Requirements", link: "/overview/requirements" },
                    { text: "Technology Stack", link: "/overview/technology-stack" },
                ],
            },
            {
                text: "02. Architecture",
                collapsed: false,
                items: [
                    { text: "High-Level Architecture", link: "/architecture/" },
                    { text: "Access Control", link: "/architecture/access-control" },
                    { text: "Content Delivery", link: "/architecture/content-delivery" },
                    { text: "Wallet Authentication", link: "/architecture/wallet-auth" },
                ],
            },
            {
                text: "03. Runtime Flows",
                collapsed: true,
                items: [{ text: "Flow Map", link: "/flows/" }],
            },
            {
                text: "04. Data & Storage",
                collapsed: true,
                items: [
                    { text: "Domain Model", link: "/data-model/" },
                    { text: "Storage Model", link: "/data-model/storage" },
                    { text: "MongoDB Collections", link: "/data-model/mongodb" },
                ],
            },
            {
                text: "05. Code",
                collapsed: true,
                items: [
                    { text: "Frontend", link: "/frontend/" },
                    { text: "Frontend Data Flow", link: "/frontend/data-flow" },
                    { text: "Backend", link: "/backend/" },
                    { text: "Backend Operations", link: "/backend/operations" },
                    { text: "Smart Contracts", link: "/smart-contracts/" },
                ],
            },
            {
                text: "06. Testing",
                collapsed: true,
                items: [{ text: "Testing Strategy", link: "/testing/" }],
            },
            {
                text: "07. Deployment",
                collapsed: true,
                items: [
                    { text: "Deployment Overview", link: "/deployment/" },
                    { text: "Secrets & Environments", link: "/deployment/secrets-environments" },
                    { text: "Documentation Deployment", link: "/deployment/documentation" },
                ],
            },
            {
                text: "08. ADRs",
                collapsed: true,
                items: [
                    { text: "ADR List", link: "/adr/" },
                    { text: "ADR-001 MinIO over IPFS", link: "/adr/minio-over-ipfs" },
                    { text: "ADR-002 Backend Access Verification", link: "/adr/backend-access-verification" },
                    { text: "ADR-003 Signed URLs", link: "/adr/signed-urls" },
                    { text: "ADR-004 Shared Reader Manager", link: "/adr/shared-reader-manager" },
                    { text: "ADR-005 Platform Billing Manager", link: "/adr/platform-billing-manager" },
                    { text: "ADR-006 Static Docs Deployment", link: "/adr/static-docs-deployment" },
                    { text: "ADR-007 Coolify Proxy Domains", link: "/adr/coolify-proxy-domains" },
                    { text: "ADR-008 TanStack Query Boundary", link: "/adr/tanstack-query-boundary" },
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
