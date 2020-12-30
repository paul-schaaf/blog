<template>
    <div>
        <img :src="images[slideIndex]" />
        <div><span @click="updateSlideIndex(-1)">Previous</span><span @click="updateSlideIndex(1)">Next</span></div>
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
            this.slideIndex += i;
        }
    }
}
</script>
