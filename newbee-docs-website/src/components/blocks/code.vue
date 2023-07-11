<template>
  <div class="block-code">
    <div class="block-code__wrapper">
      <div class="block-code__content">{{ block.data.code || block.data.escape }}</div>
    </div>
    <CopyButton classes="block-code__copy-button" :text-to-copy="block.data.code || block.data.escape" aria-label="Copy Code to Clipboard" />
  </div>
</template>
  
<script setup lang="ts">
import type { PropType } from 'vue';
import type { OutputBlockData } from '@editorjs/editorjs'
import CopyButton from '@/components/CopyButton.vue';

defineProps({
  block: {
    type: Object as PropType<OutputBlockData>,
    default: () => { },
    required: true,
  },
});

</script>