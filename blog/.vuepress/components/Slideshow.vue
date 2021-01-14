<template>
    <div>
        <div class="zoom-image">
            <img :src="images[slideIndex]"/>
        </div>
        <div style="display: flex; justify-content: center">
            <span :class="{ 'disabled-slider': slideIndex === 0 }" class="green-underline-hover" style="margin-right: 10px; cursor: pointer; user-select: none" @click="updateSlideIndex(-1)">Previous</span>
            <span :class="{ 'disabled-slider': slideIndex === images.length - 1 }" class="green-underline-hover" style="cursor:pointer; user-select: none" @click="updateSlideIndex(1)">Next</span>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        images: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            slideIndex: 0,
        }
    },
    methods: {
        updateSlideIndex(i) {
            if (i === -1 && this.slideIndex === 0) {
                return;
            } else if (i === 1 && this.slideIndex === this.images.length - 1) {
                return;
            } 
            this.slideIndex += i;
        }
    }
}
</script>

<style lang="stylus">
    .green-underline-hover:hover
        text-decoration underline
        text-decoration-color $accentColor
        text-decoration-thickness 2px
        text-underline-offset 2px

    .disabled-slider
        color lightness($textColor, 60%) !important
        text-decoration none !important
        cursor default !important
</style>
