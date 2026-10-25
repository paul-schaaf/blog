<script setup lang="ts">
import { nextTick, onMounted, watch } from "vue";
import DefaultTheme from "vitepress/theme";
import { useData, useRoute } from "vitepress";
import mediumZoom from "medium-zoom";
import PostHeader from "./components/PostHeader.vue";
import ReadingProgress from "./components/ReadingProgress.vue";

const { frontmatter } = useData();
const route = useRoute();

// Images that should open in a zoomed overlay on click.
const ZOOMABLE_IMAGE_SELECTOR = ".zoom-image img";

// medium-zoom attaches to the elements present at call time, so it is
// re-attached after every client-side navigation renders the new page.
function attachImageZoom(): void {
  mediumZoom(ZOOMABLE_IMAGE_SELECTOR, { background: "var(--vp-c-bg)" });
}

onMounted(attachImageZoom);
watch(
  () => route.path,
  () => nextTick(attachImageZoom),
);
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-top>
      <ReadingProgress v-if="frontmatter.isPost" />
    </template>
    <template #doc-before>
      <PostHeader v-if="frontmatter.isPost" />
    </template>
  </DefaultTheme.Layout>
</template>
