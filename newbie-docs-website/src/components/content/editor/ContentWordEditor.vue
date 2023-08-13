<template>
    <section data-module="writing" class="content-word-ediotr">
        <div class="writing-editor">
            <div class="word-editor-view">
                <div style="border-bottom: 1px solid #e8e8e8;">
                    <Toolbar class="editor-toolbar" style="border-bottom: 1px solid #ccc" :editor="editorRef"
                        :defaultConfig="toolbarConfig" :mode="mode" />
                </div>

                <div class="content">
                    <div class="editor-container">
                        <ContentEditorHeader @on-change="event => onChange(event, true)" @on-preview="onPreview">
                        </ContentEditorHeader>

                        <div class="title-container">
                            <input v-model="docTitle" @change="onTitleChange" placeholder="请输入标题">
                        </div>
                        <Editor class="editor-text-area" v-model="valueHtml" :defaultConfig="editorConfig" :mode="mode"
                            @onCreated="handleCreated" @onChange="onChange" @onBlur="onChange" />
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css

import { ref, shallowRef, watch } from 'vue'
// @ts-ignore
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import ContentEditorHeader from "./ContentEditorHeader.vue";
import { useDocsStore } from '@/stores/doc';
import { Message } from '@arco-design/web-vue';

const docsStore = useDocsStore();

const emit = defineEmits(["onChange", "onPreview", "onChangeTitle"]);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const title = ref('')
const docTitle = ref('')
const valueHtml = ref('')

type InsertFnType = (url: string, alt?: string, href?: string, poster?: string) => void

const toolbarConfig = {
    excludeKeys: [
        "fullScreen"
    ]
}
const editorConfig = {
    placeholder: '请输入正文',
    scroll: false, // 禁止编辑器滚动

    MENU_CONF: {
        uploadImage: {
            fieldName: 'file',
            server: import.meta.env.VITE_REST_API_BASE_URL + import.meta.env.VITE_UPLOAD_IMAGE_API_URL,
            customInsert(res: any, insertFn: InsertFnType) {
                console.log('customInsert', res)

                if (res.code === '0000') {
                    insertFn(res.result, '', res.result)
                } else {
                    Message.error(res.message)
                }
            }
        },
        uploadVideo: {
            fieldName: 'file',
            server: import.meta.env.VITE_REST_API_BASE_URL + import.meta.env.VITE_UPLOAD_VIDEO_API_URL,
            customInsert(res: any, insertFn: InsertFnType) {
                console.log('customInsert', res)

                if (res.code === '0000') {
                    insertFn(res.result, '')
                } else {
                    Message.error(res.message)
                }
            }
        }
    }
}

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}

const onChange = (event: Event, showSuccessTips?: boolean) => {
    emit('onChange', event, { title: title.value, content: editorRef.value.getHtml(), showSuccessTips })
}

const onTitleChange = async (event: Event) => {
    // 判断是否为空，为空的话，不更新
    if (docTitle.value === '') {
        docTitle.value = docsStore.doc.title
        return
    }

    title.value = docTitle.value
    docsStore.doc.title = docTitle.value
    onChange(event)
}

const onPreview = (event: Event) => {
    emit('onPreview', event)
}

const mode = 'default'

watch(() => docsStore.doc.id, () => {
    docTitle.value = docsStore.doc.title
    title.value = docTitle.value
    valueHtml.value = docsStore.doc.content
}, { immediate: true });
</script>

<style scoped>
.word-editor-view {
    background-color: var(--color-fill-2);
    border-bottom: 1px solid #e8e8e8;
}

.word-editor-view .editor-toolbar {
    width: calc(100% - var(--layout-sidebar-width));
    background-color: var(--color-bg-1);
    margin: 0 auto;
    position: fixed;
    z-index: 1;
}

.word-editor-view .content {
    margin-top: 80px;
    height: calc(100% - 40px);
    background-color: var(--color-fill-2);
    overflow-y: auto;
    position: relative;
}

.word-editor-view .editor-container {
    width: 850px;
    margin: 30px auto 150px auto;
    background-color: var(--color-bg-1);
    padding: 20px 50px 50px 50px;
    border: 1px solid var(--color-border-2);
    box-shadow: 0 2px 10px rgb(0 0 0 / 12%);
}

.word-editor-view .title-container {
    padding: 20px 0;
    border-bottom: 1px solid var(--color-border-2);
}

.word-editor-view .title-container input {
    font-weight: 700;
    font-size: 36px;
    border: 0;
    outline: none;
    width: 100%;
    line-height: 1;

    background: var(--color-bg-1);
    color: var(--color-text-1);
}

.word-editor-view .title-container input::-webkit-input-placeholder {
    color: var(--color-text-4);
}

.word-editor-view .editor-text-area {
    min-height: 900px;
    margin-top: 20px;
}

.word-editor-view .editor-text-area {
    font-size: 15px;
}
</style>

<style>
.content-word-ediotr .editor-tools {
    position: fixed;
    right: 16px;
    top: -12px;
    z-index: 1000;
}

.w-e-scroll .w-e-textarea-video-container video {
    max-width: 100%;
}

.w-e-scroll {
    min-height: 300px;
}
</style>