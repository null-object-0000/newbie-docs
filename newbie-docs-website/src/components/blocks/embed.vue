<template>
  <figure class="block-embed">
    <iframe class="block-embed__iframe" :src="block.data.embed" frameborder="0"></iframe>
    <footer v-if="block.data.caption" class="block-iframe__caption">
      {{ block.data.caption }}
    </footer>
  </figure>
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