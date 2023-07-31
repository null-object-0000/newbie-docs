<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader :docs="docs" :doc="doc" @on-edit="onEdit"></ContentPreviewHeader>

        <section class="page__content">
            <iframe ref="iframe" v-if="doc && doc.content" :src="loadUrl(doc.content as string)"></iframe>
        </section>
    </article>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue';
import type { Doc } from '@/types/global';
import { ref } from 'vue';
import { onMounted } from 'vue';
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

const iframe = ref<HTMLIFrameElement>()

const { docs, doc } = toRefs(props);

const emits = defineEmits(['onEdit']);

const onEdit = (event: Event) => {
    emits('onEdit', event);
};

const loadUrl = (url: string) => {
    return '/pandora/api/docs/loadRemote?clearCache=false&url=' + encodeURIComponent(url);
}

onMounted(() => {
    if (iframe.value) {
        const iframeValue = iframe.value as HTMLIFrameElement
        const contentWindow = iframeValue.contentWindow as Window
        iframeValue.onload = () => {
            // iframe 加载完成后，设置 iframe 的高度
            iframeValue.style.height = contentWindow.document.body.scrollHeight + 'px';
        }

        // 监听 iframe 内容变化，重新设置 iframe 的高度
        contentWindow.document.body.onresize = () => {
            iframeValue.style.height = contentWindow.document.body.scrollHeight + 'px';
        }

        contentWindow.onbeforeunload = (e: Event) => {
            console.log('onbeforeunload', e)

            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
        }
    }
})
</script>

<style scoped>
iframe {
    width: 100%;
    height: 0;
    border: 0;
}
</style>