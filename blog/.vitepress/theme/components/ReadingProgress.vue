<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

// Fraction of the scrollable height that has been scrolled, 0 to 1.
const progress = ref(0);

function updateProgress(): void {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.value = scrollable <= 0 ? 0 : Math.min(1, window.scrollY / scrollable);
}

onMounted(() => {
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateProgress);
  window.removeEventListener("resize", updateProgress);
});
</script>

<template>
  <div class="reading-progress" :style="{ transform: `scaleX(${progress})` }" />
</template>

<style scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--vp-c-brand-1);
  transform-origin: left;
  /* Above the sticky nav bar so the bar stays visible while scrolling. */
  z-index: 100;
  pointer-events: none;
}
</style>
