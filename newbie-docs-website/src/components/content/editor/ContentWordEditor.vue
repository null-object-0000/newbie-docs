<template>
    <section data-module="writing">
        <div class="writing-editor">
            <div class="word-editor-view" style="border-bottom: 1px solid #e8e8e8;">
                <div style="border-bottom: 1px solid #e8e8e8;">
                    <Toolbar class="editor-toolbar" style="border-bottom: 1px solid #ccc" :editor="editorRef"
                        :defaultConfig="toolbarConfig" :mode="mode" />
                </div>

                <div class="content">
                    <div class="editor-container">
                        <ContentEditorHeader :space="space" :space-data="spaceData" :docs="docs" :doc="doc"
                            @on-change="event => onChange(event, true)" @on-preview="onPreview"></ContentEditorHeader>

                        <div class="title-container">
                            <input v-model="docTitle" @change="onTitleChange" placeholder="请输入标题">
                        </div>
                        <Editor class="editor-text-area" v-model="valueHtml" :defaultConfig="editorConfig" :mode="mode"
                            @onCreated="handleCreated" @onChange="onChange" />
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css

import { ref, shallowRef, watch, toRefs, type PropType } from 'vue'
import type { Doc } from "@/types/global";
// @ts-ignore
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import ContentEditorHeader from "./ContentEditorHeader.vue";

const props = defineProps({
    space: {
        type: String,
        required: true,
    },
    spaceData: {
        type: Object,
        required: true,
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
const emit = defineEmits(["onChange", "onPreview"]);

const { space, spaceData, doc } = toRefs(props);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const docTitle = ref('')
const valueHtml = ref('')

const toolbarConfig = {}
const editorConfig = {
    placeholder: '请输入正文',
    scroll: false, // 禁止编辑器滚动
}

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}

const onChange = (event: Event, showSuccessTips?: boolean) => {
    emit('onChange', event, editorRef.value.getHtml(), showSuccessTips)
}

const onTitleChange = (event: Event) => {
    // 判断是否为空，为空的话，不更新
    if (docTitle.value === '') {
        docTitle.value = doc.value.title
        return
    }

    doc.value.title = docTitle.value
}

const onPreview = (event: Event) => {
    emit('onPreview', event)
}

const mode = 'default'

watch(doc, () => {
    docTitle.value = (doc.value.title || '') as string
    valueHtml.value = (doc.value.content || '') as string
}, { immediate: true });
</script>

<style scoped>
.word-editor-view .editor-toolbar {
    width: 1350px;
    background-color: #FCFCFC;
    margin: 0 auto;
    position: fixed;
    z-index: 1;
}

.word-editor-view .content {
    margin-top: 80px;
    height: calc(100% - 40px);
    background-color: rgb(245, 245, 245);
    overflow-y: auto;
    position: relative;
}

.word-editor-view .editor-container {
    width: 850px;
    margin: 30px auto 150px auto;
    background-color: #fff;
    padding: 20px 50px 50px 50px;
    border: 1px solid #e8e8e8;
    box-shadow: 0 2px 10px rgb(0 0 0 / 12%);
}

.word-editor-view .title-container {
    padding: 20px 0;
    border-bottom: 1px solid #e8e8e8;
}

.word-editor-view .title-container input {
    font-weight: 700;
    font-size: 36px;
    border: 0;
    outline: none;
    width: 100%;
    line-height: 1;

    background: #fff;
    color: black;
}

.word-editor-view .title-container input::-webkit-input-placeholder {
    color: #bfbfbf;
}

.word-editor-view .editor-text-area {
    min-height: 900px;
    margin-top: 20px;
}

.word-editor-view .editor-text-area {
    font-size: 15px;
}
</style>