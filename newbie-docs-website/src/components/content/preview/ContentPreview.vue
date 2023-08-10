<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <CBlockPreview v-if="docsStore.doc.editor === 2"></CBlockPreview>
            <CWordPreview v-else></CWordPreview>
        </section>

        <ContentPreviewFooter @on-edit="onEdit"></ContentPreviewFooter>
    </article>
</template>

<script setup lang="ts">
import ContentPreviewHeader from './ContentPreviewHeader.vue';
import ContentPreviewFooter from './ContentPreviewFooter.vue';
import CBlockPreview from "@/components/content/preview/ContentBlockPreview.vue";
import CWordPreview from "@/components/content/preview/ContentWordPreview.vue";
import { useDocsStore } from '@/stores/doc';

const docsStore = useDocsStore();

const emits = defineEmits(['onEdit']);

const onEdit = (event: Event) => {
    emits('onEdit', event);
};
</script>

<style scoped>
.page__header-time {
    width: 180px;
}
</style>