<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <template v-if="docsStore.doc.editor === 2" v-for="block of blocks">
                <div class="page__content-block">
                    <component v-if="isComponentExists('eb-' + block.type)" :is="'eb-' + block.type" :block="block" />
                    <div v-else style="background-color: pink;">eb-{{ block.type }}: {{ block.data }}</div>
                </div>
            </template>
            <div v-else v-html="docsStore.doc.content"></div>
        </section>

        <footer class="page__footer">
            <span class="updater" v-if="docsStore.doc.updater || docsStore.doc.creator">
                <icon-user />{{ docsStore.doc.updater || docsStore.doc.creator }}
            </span>
            <span class="update-time" v-if="docsStore.doc.updateTime || docsStore.doc.createTime">
                <icon-clock-circle />最后编辑于 {{ useDateFormat(docsStore.doc.updateTime || docsStore.doc.createTime,
                    'YYYY年MM月dd日 hh:mm:ss').value }}
            </span>
        </footer>
    </article>
</template>

<script setup lang="ts">
import ContentPreviewHeader from './ContentPreviewHeader.vue';
import { useDocsStore } from '@/stores/doc';
import { resolveComponent, computed } from 'vue';
import { OutputBlockData } from '@editorjs/editorjs';
import { useDateFormat } from '@vueuse/core';

const docsStore = useDocsStore();

const emits = defineEmits(['onEdit']);

const onEdit = (event: Event) => {
    emits('onEdit', event);
};

const blocks = computed(() => {
    if (docsStore.doc.editor === 2) {
        return (docsStore.doc.content ? JSON.parse(docsStore.doc.content) : []) as OutputBlockData[];
    }
});

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};
</script>

<style scoped>
.page__header-time {
    width: 180px;
}

.page__footer {
    padding-top: 62px;
}

.page__footer .updater,
.page__footer .update-time {
    color: var(--color-text-3);
    font-size: 12px;
    padding-right: 10px;
}

.page__footer .updater svg,
.page__footer .update-time svg {
    margin-right: 10px;
}
</style>