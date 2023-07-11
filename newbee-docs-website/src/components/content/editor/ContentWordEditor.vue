<template>
    <div style="border-bottom: 1px solid #e8e8e8;">
        <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
    </div>
    <div id="content">
        <div id="editor-container">
            <div id="title-container">
                <input placeholder="Page title...">
            </div>
            <Editor style="height: 500px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
                :mode="mode" @onCreated="handleCreated" />
        </div>
    </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css

import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = ref('<p>hello</p>')

// 模拟 ajax 异步获取内容
onMounted(() => {
    setTimeout(() => {
        valueHtml.value = '<p>模拟 Ajax 异步设置内容</p>'
    }, 1500)
})

const toolbarConfig = {}
const editorConfig = {
    placeholder: 'Type here...',
    scroll: false, // 禁止编辑器滚动
    MENU_CONF: {
        uploadImage: {
            fieldName: 'your-fileName',
            base64LimitSize: 10 * 1024 * 1024 // 10M 以下插入 base64
        }
    },
    onChange(editor) {
        console.log(editor.getHtml())
    }
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}

const mode = 'default'
</script>

<style scoped>
#editor-toolbar {
    width: 1350px;
    background-color: #FCFCFC;
    margin: 0 auto;
}

#content {
    height: calc(100% - 40px);
    background-color: rgb(245, 245, 245);
    overflow-y: auto;
    position: relative;
}

#editor-container {
    width: 850px;
    margin: 30px auto 150px auto;
    background-color: #fff;
    padding: 20px 50px 50px 50px;
    border: 1px solid #e8e8e8;
    box-shadow: 0 2px 10px rgb(0 0 0 / 12%);
}

#title-container {
    padding: 20px 0;
    border-bottom: 1px solid #e8e8e8;
}

#title-container input {
    font-size: 30px;
    border: 0;
    outline: none;
    width: 100%;
    line-height: 1;
}

#editor-text-area {
    min-height: 900px;
    margin-top: 20px;
}
</style>