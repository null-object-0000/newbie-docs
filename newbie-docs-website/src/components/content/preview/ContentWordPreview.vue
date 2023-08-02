<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <div v-html="doc.content"></div>
        </section>

        <ContentPreviewFooter :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewFooter>
    </article>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue';
import type { Doc } from '@/types/global';
import ContentPreviewHeader from './ContentPreviewHeader.vue';
import ContentPreviewFooter from './ContentPreviewFooter.vue';

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