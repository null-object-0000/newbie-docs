<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <div v-html="doc.content"></div>
        </section>
    </article>
</template>

<script setup lang="ts">
import { resolveComponent, type PropType, watch, toRefs, nextTick } from 'vue';
import type { Doc } from '@/types/global';
import { useUserStore } from '@/stores/user';
import ContentPreviewHeader from './ContentPreviewHeader.vue';

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

const userStore = useUserStore();

const onEdit = (event: Event) => {
    emits('onEdit', event);
};

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};

const formatTime = (time?: number) => {
    let date;
    if (time) {
        date = new Date(time);
    } else {
        date = new Date('1970-01-01')
    }

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

};

const getParent = (data: Doc[], id?: string): Doc | undefined => {
    if (id === undefined) {
        return
    }

    for (const item of data) {
        if (item.id === id) {
            return item;
        }
        if (item.child && item.child.length > 0) {
            const parent = getParent(item.child, id);
            if (parent) {
                return parent;
            }
        }
    }
}

const getParentParent = (data: Doc[], id?: string): Doc | undefined => {
    if (id === undefined) {
        return
    }

    for (const item of data) {
        if (item.id === id) {
            return getParent([docs.value], item.parentId);
        }
        if (item.child && item.child.length > 0) {
            const parent = getParentParent(item.child, id);
            if (parent) {
                return parent;
            }
        }
    }
}
</script>