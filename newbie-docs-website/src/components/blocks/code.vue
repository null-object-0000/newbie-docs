<template>
  <div class="block-code">
    <pre><code :class="[block.data.language ? `language-${block.data.language}` : 'language-javascript']">{{ block.data.code || block.data.escape }}</code></pre>
    <CopyButton classes="block-code__copy-button" :text-to-copy="block.data.code || block.data.escape"
      aria-label="Copy Code to Clipboard" />
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