<template>
  <component :is="block.data.style === 'ordered' ? 'ol' : 'ul'" :class="'block-list block-list--' + block.data.style">
    <li v-for="item of block.data.items">{{ item.content }}</li>
  </component>
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