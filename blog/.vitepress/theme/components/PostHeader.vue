<script setup lang="ts">
import { useData } from "vitepress";

const { frontmatter } = useData();
</script>

<template>
  <header class="post-header">
    <h1>{{ frontmatter.title }}</h1>
    <div class="post-meta">
      <time :datetime="frontmatter.date">{{ frontmatter.dateText }}</time>
      <div>Time to read: {{ frontmatter.readingTimeMinutes }} minutes</div>
    </div>
  </header>
</template>
