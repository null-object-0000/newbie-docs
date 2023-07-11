<template>
    <div v-html="block.data.html">
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