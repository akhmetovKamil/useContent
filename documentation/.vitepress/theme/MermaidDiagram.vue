<script setup lang="ts">
import { useData } from "vitepress";
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{
    code: string;
}>();

const container = ref<HTMLElement | null>(null);
const source = computed(() => decodeURIComponent(props.code));
let mermaidModule: typeof import("mermaid").default | null = null;
const { isDark } = useData();

const mermaidThemeVariables = computed(() => {
    if (isDark.value) {
        return {
            background: "transparent",
            primaryColor: "#123f3a",
            primaryTextColor: "#f4fbf8",
            primaryBorderColor: "#2dd4bf",
            secondaryColor: "#2b2111",
            secondaryTextColor: "#fff7ed",
            secondaryBorderColor: "#f59e0b",
            tertiaryColor: "#1f2937",
            tertiaryTextColor: "#f8fafc",
            tertiaryBorderColor: "#64748b",
            lineColor: "#cbd5e1",
            textColor: "#f8fafc",
            mainBkg: "#123f3a",
            secondBkg: "#2b2111",
            actorBkg: "#123f3a",
            actorBorder: "#2dd4bf",
            actorTextColor: "#f8fafc",
            labelBoxBkgColor: "#111827",
            labelBoxBorderColor: "#2dd4bf",
            labelTextColor: "#f8fafc",
            signalColor: "#f8fafc",
            signalTextColor: "#f8fafc",
            noteBkgColor: "#2b2111",
            noteTextColor: "#fff7ed",
            noteBorderColor: "#f59e0b",
            sequenceNumberColor: "#f59e0b",
        };
    }

    return {
        background: "transparent",
        primaryColor: "#e6fffb",
        primaryTextColor: "#0f172a",
        primaryBorderColor: "#0f766e",
        secondaryColor: "#fff7ed",
        secondaryTextColor: "#1f2937",
        secondaryBorderColor: "#d97706",
        tertiaryColor: "#f8fafc",
        tertiaryTextColor: "#0f172a",
        tertiaryBorderColor: "#94a3b8",
        lineColor: "#334155",
        textColor: "#0f172a",
        actorBkg: "#f8fafc",
        actorBorder: "#0f766e",
        actorTextColor: "#0f172a",
        labelBoxBkgColor: "#ffffff",
        labelBoxBorderColor: "#0f766e",
        labelTextColor: "#0f172a",
        signalColor: "#334155",
        signalTextColor: "#0f172a",
        noteBkgColor: "#fff7ed",
        noteTextColor: "#1f2937",
        noteBorderColor: "#d97706",
        sequenceNumberColor: "#0f766e",
    };
});

const getMermaid = async () => {
    if (mermaidModule) {
        return mermaidModule;
    }

    const imported = await import("mermaid");
    mermaidModule = imported.default;

    return mermaidModule;
};

const configureMermaid = async () => {
    const mermaid = await getMermaid();

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: mermaidThemeVariables.value,
        flowchart: {
            curve: "basis",
            useMaxWidth: true,
        },
        sequence: {
            useMaxWidth: true,
        },
    });

    return mermaid;
};

const renderDiagram = async () => {
    await nextTick();

    if (!container.value) {
        return;
    }

    container.value.textContent = source.value;
    container.value.removeAttribute("data-processed");
    const mermaid = await configureMermaid();
    await mermaid.run({ nodes: [container.value] });
};

onMounted(renderDiagram);

watch([source, isDark], renderDiagram);
</script>

<template>
    <div class="mermaid-wrapper">
        <pre ref="container" class="mermaid"></pre>
    </div>
</template>
