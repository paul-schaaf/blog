<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  images: string[];
}>();

const slideIndex = ref(0);
const isFirstSlide = computed(() => slideIndex.value === 0);
const isLastSlide = computed(() => slideIndex.value === props.images.length - 1);

function showPrevious(): void {
  if (isFirstSlide.value) {
    return;
  }
  slideIndex.value -= 1;
}

function showNext(): void {
  if (isLastSlide.value) {
    return;
  }
  slideIndex.value += 1;
}
</script>

<template>
  <div>
    <div class="zoom-image">
      <img :src="images[slideIndex]" />
    </div>
    <div style="display: flex; justify-content: center">
      <span
        :class="{ 'disabled-slider': isFirstSlide }"
        class="green-underline-hover"
        style="margin-right: 10px; cursor: pointer; user-select: none"
        @click="showPrevious"
        >Previous</span
      >
      <span
        :class="{ 'disabled-slider': isLastSlide }"
        class="green-underline-hover"
        style="cursor: pointer; user-select: none"
        @click="showNext"
        >Next</span
      >
    </div>
  </div>
</template>

<style scoped>
.green-underline-hover:hover {
  text-decoration: underline;
  text-decoration-color: var(--vp-c-brand-1);
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

.disabled-slider {
  color: var(--vp-c-text-3) !important;
  text-decoration: none !important;
  cursor: default !important;
}
</style>
