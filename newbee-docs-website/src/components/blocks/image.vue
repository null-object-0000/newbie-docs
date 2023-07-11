<template>
  <figure class="block-image">
    <div :class="classes()">
      <img :src="block.data.url" :alt="block.data.caption ? (block.data.caption || block.data.striptags) : ''">
    </div>
    <footer v-if="block.data.caption" class="block-image__caption">
      {{ block.data.caption }}
    </footer>
  </figure>
</template>
  
<script setup lang="ts">
import type { PropType } from 'vue';
import type { OutputBlockData } from '@editorjs/editorjs'

const { block } = defineProps({
  block: {
    type: Object as PropType<OutputBlockData>,
    default: () => { },
    required: true,
  },
});

const classes = function () {
  const classes = ['block-image__content']
  if (block.data.withBorder) {
    classes.push('block-image__content--bordered')
  }
  if (block.data.withBackground) {
    classes.push('block-image__content--with-background')
  }
  return classes.join(' ')
}

</script>