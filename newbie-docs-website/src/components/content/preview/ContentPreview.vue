<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <CBlockPreview v-if="doc.editor === 'block'" :doc="doc"></CBlockPreview>
            <CWordPreview v-else :doc="doc"></CWordPreview>
        </section>

        <ContentPreviewFooter :doc="doc" @on-edit="onEdit"></ContentPreviewFooter>
    </article>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue';
import type { Doc } from '@/types/global';
import ContentPreviewHeader from './ContentPreviewHeader.vue';
import ContentPreviewFooter from './ContentPreviewFooter.vue';
import CBlockPreview from "@/components/content/preview/ContentBlockPreview.vue";
import CWordPreview from "@/components/content/preview/ContentWordPreview.vue";

const props = defineProps({
    docs: {
        type: Object as PropType<Doc>,
        required: true,
    },
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { docs, doc } = toRefs(props);

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