<template>
    <div class="block-quote">
        <div class="block-quote-p">
            <p v-html="block.data.text"></p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { OutputBlockData } from '@editorjs/editorjs'

defineProps({
    block: {
        type: Object as PropType<OutputBlockData>,
        default: () => { },
        required: true,
    },
});

</script>


<style scoped>
.block-quote {
    display: block;
    padding-left: 10px;
    margin: 10px 0;
    position: relative;
}

.block-quote-p::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0px;
    bottom: 0;
    width: 2px;
    border-radius: 2px;
    background-color: #D8DAD9;
}

.block-quote-p p {
    opacity: 0.7;
}
</style>