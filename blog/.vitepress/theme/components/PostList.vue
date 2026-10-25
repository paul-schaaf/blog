<script setup lang="ts">
import { data as posts } from "../../posts.data";
</script>

<template>
  <ul class="post-list">
    <li v-for="post in posts" :key="post.url" class="post-list-item">
      <h2 class="post-list-title"><a :href="post.url">{{ post.title }}</a></h2>
      <p>{{ post.description }}</p>
      <time :datetime="post.date">{{ post.dateText }}</time>
    </li>
  </ul>
</template>
