<template>
  <div class="block-warning">
    <div class="block-warning__icon">
      ☝️
    </div>
    <div v-if="block.data.title && block.data.title.length > 0" class="block-warning__title">
      {{ block.data.title }}
    </div>
    <div class="block-warning__message">
      {{ block.data.message }}
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