<template>
    <div style="padding: 5px 0 5px 0">
        <div @click="show = !show" style="cursor:pointer; margin-bottom: 8px; user-select: none" class="underline-hover">
            <slot name="trigger" :show="show"/>
        </div>
        <slot v-if="show" name="content"/>
    </div>
</template>

<script>
export default {
    data() {
        return {
            show: false
        }
    }
}
</script>
