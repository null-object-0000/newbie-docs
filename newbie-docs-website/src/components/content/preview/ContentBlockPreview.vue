<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <template v-for="block of doc.content">
                <div class="page__content-block">
                    <component v-if="isComponentExists('eb-' + block.type)" :is="'eb-' + block.type" :block="block" />
                    <div v-else style="background-color: pink;">eb-{{ block.type }}: {{ block.data }}</div>
                </div>
            </template>
        </section>

        <ContentPreviewFooter :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewFooter>
    </article>
</template>

<script setup lang="ts">
import { resolveComponent, type PropType, toRefs } from 'vue';
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

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};

</script>

<style scoped>
.page__header-time {
    width: 180px;
}
</style>