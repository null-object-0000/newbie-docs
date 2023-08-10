<template>
    <div v-html="docsStore.doc.content"></div>
</template>

<script setup lang="ts">
import { useDocsStore } from '@/stores/doc';

const docsStore = useDocsStore();
</script>