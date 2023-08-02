<template>
    <div v-html="doc.content"></div>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue';
import type { Doc } from '@/types/global';

const props = defineProps({
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { doc } = toRefs(props);
</script>