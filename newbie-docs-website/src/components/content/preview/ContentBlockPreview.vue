<template>
    <template v-for="block of content">
        <div class="page__content-block">
            <component v-if="isComponentExists('eb-' + block.type)" :is="'eb-' + block.type" :block="block" />
            <div v-else style="background-color: pink;">eb-{{ block.type }}: {{ block.data }}</div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { resolveComponent, watch } from 'vue';
import type { OutputBlockData } from "@editorjs/editorjs";
import { ref } from 'vue';
import { useDocsStore } from '@/stores/doc';

const docsStore = useDocsStore();

const content = ref<OutputBlockData[]>([]);

watch(() => docsStore.doc.content, () => {
    if (docsStore.doc.editor === 2) {
        content.value = (docsStore.doc.content ? JSON.parse(docsStore.doc.content) : []) as OutputBlockData[];
    }
}, { immediate: true });

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};

</script>