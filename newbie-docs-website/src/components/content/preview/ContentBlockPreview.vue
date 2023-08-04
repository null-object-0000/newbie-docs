<template>
    <template v-for="block of content">
        <div class="page__content-block">
            <component v-if="isComponentExists('eb-' + block.type)" :is="'eb-' + block.type" :block="block" />
            <div v-else style="background-color: pink;">eb-{{ block.type }}: {{ block.data }}</div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { resolveComponent, type PropType, watch, toRefs } from 'vue';
import type { Doc } from '@/types/global';
import type { OutputBlockData } from "@editorjs/editorjs";
import { ref } from 'vue';

const props = defineProps({
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { doc } = toRefs(props);
const content = ref<OutputBlockData[]>([]);

watch(() => doc.value.content, () => {
    content.value = doc.value.content as OutputBlockData[];
}, { immediate: true });

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};

</script>