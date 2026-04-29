<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{
    code: string;
}>();

const container = ref<HTMLElement | null>(null);
const source = computed(() => decodeURIComponent(props.code));
let mermaidModule: typeof import("mermaid").default | null = null;

const getMermaid = async () => {
    if (mermaidModule) {
        return mermaidModule;
    }

    const imported = await import("mermaid");
    mermaidModule = imported.default;
    mermaidModule.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
        flowchart: {
            curve: "basis",
            useMaxWidth: true,
        },
        sequence: {
            useMaxWidth: true,
        },
    });

    return mermaidModule;
};

const renderDiagram = async () => {
    await nextTick();

    if (!container.value) {
        return;
    }

    container.value.textContent = source.value;
    container.value.removeAttribute("data-processed");
    const mermaid = await getMermaid();
    await mermaid.run({ nodes: [container.value] });
};

onMounted(renderDiagram);

watch(source, renderDiagram);
</script>

<template>
    <div class="mermaid-wrapper">
        <pre ref="container" class="mermaid"></pre>
    </div>
</template>
