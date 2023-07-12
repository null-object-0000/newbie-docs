<template>
  <component :id="id" :is="'h' + block.data.level" :class="'block-header block-header--' + block.data.level">
    <CopyButton classes="block-header__copy-button" :text-to-copy="textToCopy"
      :aria-label="'Copy Link to the ' + block.data.text" />
    <a :href="'#' + id">
      {{ block.data.text }}
    </a>
  </component>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import type { OutputBlockData } from '@editorjs/editorjs'
import CopyButton from '@/components/CopyButton.vue';

const { block } = defineProps({
  block: {
    type: Object as PropType<OutputBlockData>,
    default: () => { },
    required: true,
  },
});

const id = ref('outline_' + (block.id || (block.data.text || block.data.urlify)))
const textToCopy = ref(id.value)

</script>