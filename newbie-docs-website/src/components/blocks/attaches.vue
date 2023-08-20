<template>
    <div class="block-attaches">
        <div class="cdx-attaches cdx-attaches--with-file">
            <div class="cdx-attaches__file-icon">
                <div class="cdx-attaches__file-icon-background">
                    <icon-attachment />
                </div>
            </div>
            <div class="cdx-attaches__file-info">
                <div class="cdx-attaches__title">{{ block.data.title }}</div>
            </div>
            <a style="margin-right: 10px;" class="cdx-attaches__download-button" :href="block.data.file.url" target="_blank"
                rel="nofollow noindex noreferrer">
                <icon-eye />
            </a>

            <a class="cdx-attaches__download-button" @click="downloadFile">
                <icon-download />
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { OutputBlockData } from '@editorjs/editorjs'
import { toRefs } from 'vue';

const props = defineProps({
    block: {
        type: Object as PropType<OutputBlockData>,
        default: () => { },
        required: true,
    },
});

const { block } = toRefs(props);

const downloadFile = () => {
    const link = document.createElement('a');
    link.download = block.value.data.title;
    link.style.display = 'none';
    const blob = new Blob([block.value.data.file.url], { type: 'octet/stream' });
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

</script>