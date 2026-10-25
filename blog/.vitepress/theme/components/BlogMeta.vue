<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useData } from "vitepress";

const { page, frontmatter } = useData();

// Locale-dependent date formatting differs between the server render and the
// browser, so the text is only filled in after mount to avoid a hydration
// mismatch.
const lastUpdatedText = ref("");

onMounted(() => {
  const timestamp = page.value.lastUpdated;
  if (timestamp === undefined) {
    throw new Error(
      `BlogMeta used on ${page.value.filePath} but the page has no lastUpdated timestamp`,
    );
  }
  lastUpdatedText.value = new Date(timestamp).toLocaleString();
});
</script>

<template>
  <div class="gray-section">
    <span class="title">Last updated: </span>
    <time>{{ lastUpdatedText }}</time>
    <p class="margin-bottom-zero">
      <span class="title">Time to read: </span>{{ frontmatter.readingTimeMinutes }} minutes
    </p>
  </div>
</template>
