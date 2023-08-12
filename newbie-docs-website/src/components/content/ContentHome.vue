<template>
    <template v-if="loading.get()">
        <a-spin style="margin: 0 auto; margin-top: calc(40vh + 28px); justify-content: center; display: flex;" dot></a-spin>
    </template>
    <div v-else-if="book && book.id" class="docs-content-home"
        :style="{ background: `linear-gradient(rgba(255, 255, 255, 0) 0px, rgb(255, 255, 255) 70vh, rgb(255, 255, 255) 100%), url('${coverImg(book.id)}') center top / 100% no-repeat` }">
        <div class="docs-content-home__wrapper">
            <div class="docs-content-home__body">
                <div class="docs-content-home__header">
                    <docs-icon-book-type-default style="margin-right: 18px" />
                    <span v-if="editMode === false">
                        {{ book.title }}
                    </span>
                    <div v-else class="rename-title-input-wrapper">
                        <a-input size="large" ref="renameInputRef" v-model="docTitle">
                            <template #append>
                                <a-button @click="submitRenameTitle">
                                    <template #icon><icon-check></icon-check></template>
                                </a-button>
                            </template>
                        </a-input>
                    </div>

                    <a-button :loading="saveHomeLoading.get()" v-if="editHome"
                        class="docs-content-home__actions docs-content-home__edit-home-save-actions" @click="saveHome">
                        更新
                    </a-button>
                    <a-dropdown v-else @select="onSpaceSetting" position="br" :popup-max-height="false">
                        <a-button class="docs-content-home__actions docs-content-home__more-actions">
                            <template #icon>
                                <icon-more />
                            </template>
                        </a-button>

                        <template #content>
                            <a-doption value="rename">
                                <template #icon><icon-loop /></template>
                                重命名
                            </a-doption>
                            <a-doption value="editHome">
                                <template #icon><icon-edit /></template>
                                编辑首页
                            </a-doption>
                            <a-doption value="permission">
                                <template #icon><icon-lock /></template>
                                权限管理
                            </a-doption>
                            <a-doption value="more" @click="editBookModal.form = book; editBookModal.visible = true">
                                <template #icon><icon-more /></template>
                                更多设置
                            </a-doption>
                            <a-doption value="delete" :style="{ color: 'rgb(var(--danger-6))' }">
                                <template #icon><icon-delete /></template>
                                删除
                            </a-doption>
                        </template>
                    </a-dropdown>

                    <div class="docs-content-home__statistics">
                        <span class="docs-content-home__docCount">
                            <b class="docs-content-home__count">{{ book.docsCount }}</b>文档
                        </span>
                        <span class="docs-content-home__wordCount">
                            <b class="docs-content-home__count">{{ book.wordsCount }}</b>字
                        </span>
                    </div>
                </div>

                <div v-if="home && (homeDocContent.length > 0 || editHome)" class="home-doc-content">
                    <div v-if="editHome" style="border: 1px solid #ccc;">
                        <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                            mode="default" />
                        <Editor style="height: 188px; overflow-y: hidden;" v-model="home.content"
                            :defaultConfig="editorConfig" mode="default" @onCreated="handleCreated" />
                    </div>
                    <div v-else v-html="home.content">

                    </div>
                </div>
                <div v-else-if="book.docsCount <= 0" class="docs-content-home__default_content">
                    <p> 👋
                        <text style="font-weight: bold; display: inline-block;">
                            欢迎来到知识库
                        </text>
                    </p>
                    <p>
                        <text style="text-indent: 2em; display: inline-block;">
                            知识库就像书一样，让多篇文档结构化，方便知识的创作与沉淀
                        </text>
                    </p>
                </div>

                <div v-if="book.docsCount > 0" style="margin-top: 52px;">
                    <a-tree ref="homeTreeRef" block-node default-expand-all class="docs-content-home__tree"
                        v-if="sidebarData.dir" :data="sidebarData.dir"
                        @select="(selectedKeys, { node }) => jump2Doc(node?.key, false)">
                        <template #title="node">
                            <div class="content">
                                <span class="title">{{ node?.title }}</span>
                                <span class="dashed-line"></span>
                                <span class="time">{{ node.time }}</span>
                            </div>
                        </template>
                    </a-tree>
                </div>
            </div>
        </div>
    </div>

    <PermissionModal v-if="permissionModal.visible" :data-type="1" v-model:visible="permissionModal.visible" :book="book"
        width="750px">
    </PermissionModal>

    <BookSettingsModal v-if="editBookModal.form" v-model:visible="editBookModal.visible" v-model="editBookModal.form"
        @saved="bookSaved">
    </BookSettingsModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, shallowRef, onMounted, ref, reactive, nextTick, onBeforeMount } from "vue";
import { useConfigsStore } from "@/stores/config";
import PermissionModal from "@/components/modals/PermissionModal.vue";
import { Message, Modal, TreeInstance, TreeNodeData } from "@arco-design/web-vue";
import { useRoute, useRouter } from "vue-router";
import { useBooksApi } from "@/api/books";
import { Book, Doc } from "@/types/global";
import { useDocsStore } from '@/stores/doc'
import { useLoading } from '@/hooks';
import BookSettingsModal from "../modals/BookSettingsModal.vue";
import { useDateFormat } from "@vueuse/core";
import { useDocsEventBus } from "@/events/docs";
// @ts-ignore
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { computed } from "vue";
import { AxiosError } from "axios";

const route = useRoute()
const router = useRouter()

const configsStore = useConfigsStore()
const docsStore = useDocsStore()

const booksApi = useBooksApi('localStorage')

const docsEventBus = useDocsEventBus();

const homeTreeRef = ref<TreeInstance | null>(null)

const loading = useLoading()
loading.set(true)

const saveHomeLoading = useLoading()

const bookSlug = route.params.bookSlug as string

const book = ref<Book>()
const home = ref<Doc>()

const homeDocContent = computed(() => {
    if (home.value) {
        if (home.value.content === '<p></p>' || home.value.content === '<p><br></p>') {
            return ''
        } else {
            return home.value.content
        }
    } else {
        return ''
    }
})

const editHome = ref(false)

const permissionModal = reactive({
    visible: false,
})

let editMode = ref(false)
let docTitle = ref('')
const renameInputRef = ref<HTMLElement | null>(null)

const editBookModal = reactive({
    visible: false,
    form: null as Book | null,
})

const coverImg = (id: number) => {
    const maxIndex = 5
    const index = id % maxIndex + 1
    return `/img/cover_${index}.png`
}

const onSpaceSetting = async (value: string | number | Record<string, any> | undefined, ev: Event) => {
    if (!book.value) {
        return
    }

    if (value === 'rename') {
        docTitle.value = book.value.title
        editMode.value = true
        await nextTick()
        renameInputRef.value?.focus()
    } else if (value === 'editHome') {
        editHome.value = true
    }
    else if (value === 'delete') {
        const bookId = book.value.id as number
        Modal.warning({
            title: `确认框`,
            simple: true,
            content: `确认删除 “${book.value.title}” 知识库吗？`,
            hideCancel: false,
            onOk: async () => {
                const result = await booksApi.remove(bookId as number)
                if (result) {
                    Message.success('删除成功')
                    router.push('/')
                } else {
                    Message.error('删除失败')
                }
            }
        })
    } else if (value === 'permission') {
        permissionModal.visible = true
    }
}

const submitRenameTitle = async (event: Event) => {
    if (!book.value) {
        return
    }

    if (docTitle.value && docTitle.value.length > 0) {
        const result = await booksApi.changeTitle(book.value.id as number, docTitle.value)
        if (result) {
            book.value.title = docTitle.value
        }

        configsStore.setHeader('/', docTitle.value);
        document.title = '首页 - ' + docTitle.value
    }
    editMode.value = false
}

const bookSaved = async (result: boolean) => {
    console.log('bookSaved', result)

    if (result && book.value) {
        // FIXME: 更新知识库名称后文档集中 root 节点的标题不会更新
        configsStore.setHeader('/', book.value.title);
        document.title = '首页 - ' + book.value.title
    }
}

// 以下是编辑首页相关逻辑 ---------------------------------------------------------------

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}

const saveHome = async (event: Event) => {
    if (!home.value) {
        return
    }

    saveHomeLoading.set(true)
    try {
        home.value.editor = 1
        home.value.sort = 0
        const result = await docsStore.docsApi.put(bookSlug, home.value, true)
        if (result) {
            editHome.value = false
        }
    } catch (error) {
        if (error instanceof AxiosError) {
            Message.error(error.message)
        }

        console.error(error)
    } finally {
        saveHomeLoading.set(false)
    }
}

// 以下是索引内容相关逻辑 ---------------------------------------------------------------
const sidebarData = reactive({
    rawDir: [],
    fullDir: [],
    dir: [],
    selectedKeys: [],
    editMode: false,
    hoverNode: null,
    renameDocSlug: '',
    docTitle: '',
    settingDoc: undefined
} as {
    rawDir: Doc[],
    fullDir: TreeNodeData[],
    dir: TreeNodeData[],
    selectedKeys: Array<string | number>,
    editMode: boolean,
    hoverNode: string | null,
    renameDocSlug: string,
    docTitle: string,
    settingDoc: Doc | undefined,
});

const formatDirData = (dir: Doc[]): TreeNodeData[] => {
    return dir.filter(doc => doc.slug !== 'home').map(item => {
        const nowDate = new Date()
        const timeDate = new Date(item.updateTime || item.createTime)
        let time = useDateFormat(timeDate, 'YYYY-MM-DD HH:mm')
        if (timeDate.getFullYear() === nowDate.getFullYear() && timeDate.getMonth() === nowDate.getMonth() && timeDate.getDate() === nowDate.getDate()) {
            time = useDateFormat(timeDate, '今天 HH:mm')
        } else if (timeDate.getFullYear() === nowDate.getFullYear()) {
            time = useDateFormat(timeDate, 'MM-DD HH:mm')
        }

        const node = { ...item, time } as TreeNodeData

        if (item.children && item.children.length > 0) {
            node.children = formatDirData(item.children)
        }

        node.key = `/${bookSlug}/${item.slug}`
        node.title = item.title
        node.draggable = false

        return node
    })
}

const updateDirData = (dir?: Doc) => {
    sidebarData.rawDir = dir?.children || []
    sidebarData.fullDir = formatDirData(JSON.parse(JSON.stringify(dir?.children || [])))

    sidebarData.dir = JSON.parse(JSON.stringify(sidebarData.fullDir))

    nextTick(() => {
        homeTreeRef.value?.expandAll()
    })
}

const jump2Doc = (path: string | number | undefined, docEditMode: boolean) => {
    if (typeof path === 'string' && path) {
        configsStore.docEditMode = docEditMode
        router.push(path)
    }
}

onBeforeMount(async () => {
    try {
        book.value = await booksApi.get(bookSlug) as Book
        home.value = await docsStore.docsApi.get(bookSlug, 'home') as Doc
        updateDirData(docsStore.dir)
    } finally {
        loading.set(false)
    }
})

docsEventBus.onDirChange(bookSlug, (event: Event, value: { space: string, dir: Doc }) => {
    // 先更新成空数据，再更新真实数据，强制触发 tree 的更新
    updateDirData()

    updateDirData(value.dir)
})
</script>

<style scoped>
.docs-content-home {
    width: 100%;
    will-change: padding-left;
}

.docs-content-home__wrapper {
    padding: 64px 32px 0 32px;
    position: relative;
}

.docs-content-home__body {
    background: hsla(0, 0%, 100%, 0.9);
    border-radius: 12px;
    padding: 32px;
    min-height: calc(100vh - 64px - 32px - 2 * var(--layout-height-header));
    margin: 0 auto;
}

body[arco-theme='dark'] .docs-content-home__body {
    background: hsla(0, 0%, 0%, 0.9);
}

@media (min-width: 1300px) {
    .docs-content-home__body {
        max-width: 696px;
    }
}

@media (min-width: 1440px) {
    .docs-content-home__body {
        max-width: 696px;
    }
}

@media (min-width: 1920px) {
    .docs-content-home__body {
        max-width: 1020px;
    }
}

.docs-content-home__header {
    font-size: 28px;
    color: var(--color-text-1);
    font-weight: 700;
    margin-left: 18px;
}

.docs-content-home__actions {
    border-radius: 6px;
    text-align: center;
    padding: 7px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 0 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;

    width: 32px;

    margin: 0;

    line-height: 16px;
    padding: 0;
    float: right;
}

.docs-content-home__actions.docs-content-home__more-actions {
    border: 1px solid var(--color-border-1);
    color: var(--color-text-1);
    background: var(--color-bg-1);
}

.docs-content-home__actions.docs-content-home__more-actions:hover {
    background: var(--color-fill-2);
}

.docs-content-home__actions.docs-content-home__edit-home-save-actions {
    width: 72px;
    background: #00b96b;
    color: #FFFFFF
}

.docs-content-home__statistics {
    margin: 6px 0 6px 58px;
}

.docs-content-home__docCount,
.docs-content-home__wordCount {
    font-size: 14px;
    color: var(--color-text-3);
    text-align: center;
}

.docs-content-home__docCount {
    margin: 0 33px 0 0;
}

.docs-content-home__wordCount {}

.docs-content-home__count {
    color: #585A5A;
    font-family: DIN Alternate Bold, Pingfang SC, Hiragino Sans GB, Helvetica, Droid Sans, Microsoft YaHei, Arial, sans-serif;
    font-size: 18px;
    margin-right: 8px;
    font-weight: 700;
}

.docs-content-home__default_content {
    margin: 60px 0 0;

    position: relative;
    z-index: 1;
    outline: none;
    white-space: pre-wrap;
    white-space: break-spaces;
    word-break: break-word;
    word-wrap: break-word;
    font-family: 'Chinese Quote', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-variant-ligatures: none;

    font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Segoe UI';

    font-size: 15px;
    line-height: 1.74;

    letter-spacing: initial;
}

.docs-content-home .rename-title-input-wrapper {
    width: 70%;
    display: inline-block;
    position: relative;
    top: -4px;
}
</style>

<style>
.rename-title-input-wrapper span.arco-input-append {
    padding: 0 2px;
}

.docs-content-home__tree .arco-tree-node .arco-tree-node-title-text {
    width: 100%;
}

.docs-content-home__tree .arco-tree-node .content {
    font-size: 15px;

    display: flex;
    flex: 1;
    align-items: center;
    overflow: hidden;
}

.docs-content-home__tree .arco-tree-node .content .title {
    font-size: 15px;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.docs-content-home__tree .arco-tree-node .content .dashed-line {
    flex: 1;
    margin: 0 16px;
    border-top: 1px dashed #D8DAD9;
}

.docs-content-home__tree .arco-tree-node .content .time {
    color: #8A8F8D;
    font-size: 14px;
}

.home-doc-content {
    width: calc(100% - 45px);
    margin: 0 auto;
    margin-top: 60px;
}
</style>