<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();

const readingTimeUnit = computed(() =>
  frontmatter.value.readingTimeMinutes === 1 ? "minute" : "minutes",
);
</script>

<template>
  <header class="post-header">
    <h1>{{ frontmatter.title }}</h1>
    <div class="post-meta">
      <time :datetime="frontmatter.date">{{ frontmatter.dateText }}</time>
      <div>Time to read: {{ frontmatter.readingTimeMinutes }} {{ readingTimeUnit }}</div>
    </div>
  </header>
</template>
