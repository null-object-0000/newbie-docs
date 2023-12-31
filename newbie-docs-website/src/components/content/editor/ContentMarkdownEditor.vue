<template>
    <section data-module="writing" class="content-markdown-ediotr">
        <div class="writing-editor">
            <mavon-editor ref="mavonEditorRef" v-model="markdown" @imgAdd="onImgAddMarkdown" @change="onChangeMarkdown"
                @save="onSaveMarkdown" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDocsStore } from '@/stores/doc';
import { Message, MessageReturn } from '@arco-design/web-vue';
import { useFilesApi } from '@/api/index';
import { AxiosError } from 'axios';

const docsStore = useDocsStore();

const emit = defineEmits(["onChange", "onChangeTitle"]);

const mavonEditorRef = ref<any>()
const markdown = ref('')

const checkDocTitle = (content: string) => {
    if (content && content.length > 0) {
        // 匹配开头是否是标题
        const reg = /^#+\s/
        return reg.test(content)
    } else {
        return false
    }
}

const docTitleEmptyMessageRef = ref<MessageReturn>()
const onChange = (event: Event, value: string, render: string, forceRemote?: boolean) => {
    if (checkDocTitle(markdown.value) === false) {
        docTitleEmptyMessageRef.value = Message.error({
            id: 'doc_title_empty_message',
            content: '请在文章开头添加标题'
        }) as MessageReturn
        return
    } else {
        docTitleEmptyMessageRef.value?.close()
    }

    // 提取标题
    const title = markdown.value.split('\n')[0].replace(/^#+\s/, '')

    emit('onChange', event, { title, content: JSON.stringify({ value, render }), forceRemote })
}

const onImgAddMarkdown = async (pos: number, imgfile: File) => {
    return useFilesApi().uploadImage(imgfile)
        .then((url) => {
            mavonEditorRef.value.$img2Url(pos, url)
        }).catch((error) => {
            if (error instanceof AxiosError) {
                Message.error(error.message)
            }

            console.error(error)
        })
}

const onChangeMarkdown = (value: string, render: string) => {
    onChange(new Event('markdown.change'), value, render, false)
}

const onSaveMarkdown = (value: string, render: string) => {
    onChange(new Event('markdown.save'), value, render, true)
}

watch(() => docsStore.doc.id, () => {
    const content = JSON.parse(docsStore.doc.content)
    markdown.value = content.value
}, { immediate: true });
</script>

<style>
.content-markdown-ediotr .editor-tools {
    position: fixed;
    right: 16px;
    top: -5px;
    z-index: 1000;
}

.docs_3_edit .docs__content {
    margin: 0;
    padding: 0;
}

.docs_3_edit .docs__content .docs__content-inner {
    margin: 0;
    padding: 0;

    padding: 30px 50px;
}

.docs_3_edit .docs__content .markdown-body {
    width: calc(100vw - var(--layout-sidebar-width) - 100px);
    height: calc(100vh - var(--layout-height-header) - 60px);
}
</style>