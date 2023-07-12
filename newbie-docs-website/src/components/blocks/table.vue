<template>
  <table class="block-table">
    <tr v-for="row of block.data.content">
      <td v-for="cell of row" v-html="cell"></td>
    </tr>
  </table>
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