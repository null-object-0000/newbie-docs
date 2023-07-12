<template>
  <div class="block-checklist">
    <div v-for="item of block.data.items" class="block-checklist__item">
      <span v-if="item.checked" class="block-checklist__item-checkbox block-checklist__item-checkbox--checked"></span>
      <span v-else class="block-checklist__item-checkbox"></span>
      <div class="block-checklist__item-text">{{ item.text }}</div>
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