import DefaultTheme from "vitepress/theme";
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute } from "vitepress";
import MermaidDiagram from "./MermaidDiagram.vue";
import "./styles.css";

function updateOutlineActiveLink() {
    const headings = [...document.querySelectorAll<HTMLElement>(".vp-doc h2[id], .vp-doc h3[id]")];
    const links = [...document.querySelectorAll<HTMLAnchorElement>(".VPDocAsideOutline .outline-link")];

    if (!headings.length || !links.length) {
        return;
    }

    const viewportHeight = window.innerHeight;
    const visibleHeadings = headings.filter((heading) => {
        const rect = heading.getBoundingClientRect();
        return rect.top < viewportHeight * 0.72 && rect.bottom > 0;
    });

    const activeHeading =
        visibleHeadings.at(-1) ??
        [...headings].reverse().find((heading) => heading.getBoundingClientRect().top <= viewportHeight * 0.3) ??
        headings[0];

    links.forEach((link) => link.classList.remove("active"));

    const activeLink = links.find((link) => decodeURIComponent(link.hash.slice(1)) === activeHeading.id);
    activeLink?.classList.add("active");
}

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component("MermaidDiagram", MermaidDiagram);
    },
    setup() {
        const route = useRoute();

        onMounted(() => {
            window.addEventListener("scroll", updateOutlineActiveLink, { passive: true });
            window.addEventListener("resize", updateOutlineActiveLink, { passive: true });
            nextTick(updateOutlineActiveLink);
        });

        onBeforeUnmount(() => {
            window.removeEventListener("scroll", updateOutlineActiveLink);
            window.removeEventListener("resize", updateOutlineActiveLink);
        });

        watch(
            () => route.path,
            () => nextTick(updateOutlineActiveLink),
        );
    },
};
