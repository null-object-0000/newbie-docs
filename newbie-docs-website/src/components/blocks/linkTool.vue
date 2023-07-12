<template>
    <a class="block-link" :href="block.data.link" target="_blank" rel="nofollow">
        <img v-if="block.data.meta.image && block.data.meta.image.url" class="block-link__image" :src="block.data.meta.image.url">

        <div class="block-link__title">
            {{ block.data.meta.title }}
        </div>

        <div class="block-link__description">
            {{ block.data.meta.description }}
        </div>

        <span class="block-link__domain">
            {{ parseLink(block.data.link).hostname }}
        </span>
    </a>
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

const parseLink = function (linkUrl: string): URL {
    try {
        return new URL(linkUrl);
    } catch (e) {
        console.log(e);
        return new URL('')
    }
}

</script>