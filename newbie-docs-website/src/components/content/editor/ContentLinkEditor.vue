<template>

</template>

<script setup lang="ts">
import { ref, toRefs, watch, reactive, type PropType } from "vue";
import type { Doc, CustomEditorConfig } from "@/types/global";

const props = defineProps({
    space: {
        type: String,
        required: true,
    },
    spaceData: {
        type: Object,
        required: true,
    },
    editorConfig: {
        type: Object as PropType<CustomEditorConfig>,
        default: () => { },
        required: false,
    },
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
    docs: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { space, spaceData, editorConfig, doc } = toRefs(props);
</script>

<style scoped></style>