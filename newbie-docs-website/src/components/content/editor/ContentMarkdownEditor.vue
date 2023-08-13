<template>
    <section data-module="writing" class="content-markdown-ediotr">
        <ContentEditorHeader @on-change="event => onChange(event, true)" @on-preview="onPreview">
        </ContentEditorHeader>
        <div class="writing-editor">
            <!-- <div class="title-container">
                <input v-model="docTitle" @change="onTitleChange" placeholder="请输入标题">
            </div> -->

            <mavon-editor v-model="markdown" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ContentEditorHeader from "./ContentEditorHeader.vue";
import { useDocsStore } from '@/stores/doc';
import { Message } from '@arco-design/web-vue';

const docsStore = useDocsStore();

const emit = defineEmits(["onChange", "onPreview", "onChangeTitle"]);

const markdown = ref('')

const onPreview = (event: Event) => {
    emit('onPreview', event)
}

const onChange = (event: Event, showSuccessTips?: boolean) => {
    emit('onChange', event, { content: markdown.value, showSuccessTips })
}

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