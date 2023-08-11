<template>
  <div class="content-view" v-if="docsStore.dir">
    <div class="docs">
      <CSidebar :space="bookSlug" @on-create="docsService.onCreate" @on-copy="docsService.onCopy"
        @on-remove="docsService.onRemove" @on-change-title="docsService.onChangeTitle"
        @on-change-parent-id="docsService.onChangeParentId" @on-change-sort="docsService.onChangeSort">
      </CSidebar>
      <template v-if="loading.get()">
        <a-spin style="margin: 0 auto; margin-top: calc(40vh + 28px); justify-content: center; display: flex;"
          dot></a-spin>
      </template>
      <template v-else-if="docsStore.doc">
        <div v-if="docsStore.doc.slug !== 'home'" class="docs__content"
          :class="configsStore.docEditMode && docsStore.doc.editor === 1 ? 'docs_content_word_editor' : ''">
          <div class="docs__content-inner">
            <template v-if="configsStore.docEditMode">
              <CBlockEditor v-if="docsStore.doc.editor === 2" :editor-config="{ headerPlaceholder: '请输入标题' }"
                @on-change="docsService.onEditorChange" @on-preview="onPreview"
                @on-change-title="docsService.onChangeTitle">
              </CBlockEditor>
              <CWordEditor v-else-if="docsStore.doc.editor === 1" :editor-config="{ headerPlaceholder: '请输入标题' }"
                @on-change="docsService.onEditorChange" @on-preview="onPreview"
                @on-change-title="docsService.onChangeTitle">
              </CWordEditor>
            </template>
            <template v-else>
              <CPreview @onEdit="configsStore.docEditMode = true">
              </CPreview>
            </template>
          </div>

          <aside v-if="!configsStore.docEditMode || docsStore.doc.editor !== 1" class="docs__aside-right">
            <COutline></COutline>
          </aside>
        </div>
        <CHome v-else></CHome>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@/assets/docs-main.css";
import "@/assets/docs-code-styling.css";

import CHome from "@/components/content/ContentHome.vue";
import CSidebar from "@/components/content/ContentSidebar.vue";
import CBlockEditor from "@/components/content/editor/ContentBlockEditor.vue";
import CWordEditor from "@/components/content/editor/ContentWordEditor.vue";
import CPreview from "@/components/content/preview/ContentPreview.vue";
import COutline from "@/components/content/ContentOutline.vue";
import { useRoute, useRouter } from "vue-router";
import { nextTick, watch, ref } from "vue";
import { Message, Notification, type NotificationConfig, type NotificationReturn } from '@arco-design/web-vue';
import type { Doc, Book } from "@/types/global";
import { useUsersStore } from '@/stores/user';
import { useDocsStore } from '@/stores/doc';
import { useConfigsStore } from "@/stores/config";
import { OutputBlockData } from "@editorjs/editorjs";
import { useLoading } from '@/hooks';
import { AxiosError } from "axios";

const route = useRoute();
const router = useRouter();
const { loginUser } = useUsersStore();
const configsStore = useConfigsStore();
const docsStore = useDocsStore();

const loading = useLoading()

const bookSlug = ref(route.params.bookSlug as string)
const docSlug = ref(route.params.docSlug as string)

const onPreview = function () {
  configsStore.docEditMode = false;
};

const lastDocContent = ref({} as Record<string, string>);
const historyNotification = [] as NotificationReturn[]

const docsService = {
  checkDocContentIsChanged: (doc: Doc) => {
    const content = doc.title + doc.content
    if (lastDocContent.value[doc.slug] !== content) {
      lastDocContent.value[doc.slug] = content;
      return true;
    } else {
      return false;
    }
  },

  onCreate: async (event: Event, value: Doc | undefined) => {
    if (value === undefined || value === null) {
      return false
    }

    loading.set(true)

    const slug = await docsStore.docsApi.generateSlug(12)
    const rootId = docsStore.dir.id as number
    const homeId = docsStore.dir.children?.filter((item) => item.slug === 'home')[0].id as number
    let parentId = value?.parentId
    if (parentId === undefined || parentId <= 0) {
      parentId = homeId;
    }

    parentId = parentId === homeId ? rootId : parentId

    let content;
    if (value.editor === 2) {
      content = value.content || JSON.stringify([
        {
          type: "header",
          data: {
            text: "",
            level: 2,
          },
        },
      ] as OutputBlockData[])
    } else if (value.editor === 3) {
      content = value.content || ''
    } else {
      content = value.content || ''
    }

    const doc: Doc = {
      id: -1,

      bookId: -1,
      bookSlug: bookSlug.value,

      slug,
      parentId,
      editor: value.editor || 2,
      path: `/${bookSlug.value}/${slug}`,
      title: value.title || "无标题文档",
      content,
      wordsCount: -1,
      children: [],
      creator: loginUser.username + loginUser.id,
      createTime: Date.now(),
      sort: -1,
    };

    if (!docsService.checkDocContentIsChanged(doc)) {
      console.log('文档内容没有变化，不需要保存')
      return false;
    }

    try {
      const result = await docsStore.docsApi.put(bookSlug.value, doc);
      if (result) {
        docSlug.value = slug
        configsStore.docEditMode = true
        router.push(doc.path)
      }
      return result
    } catch (error) {
      if (error instanceof AxiosError) {
        Message.error(error.message)
      }

      console.error(error)
    } finally {
      loading.set(false)
    }
  },
  onCopy: async (event: Event, value: { slug: string }) => {
    if (!value?.slug) {
      return
    }

    const doc = await docsStore.docsApi.get(bookSlug.value, value.slug) as Doc
    if (doc) {
      docsService.onCreate(event, {
        parentId: doc.parentId,
        title: `${doc.title} - 副本`,
        editor: doc.editor,
        content: doc.content
      } as Doc)
    }
  },
  onRemove: async (event: Event, id: number): Promise<boolean> => {
    const result = await docsStore.docsApi.remove(bookSlug.value, id)
    if (result) {
      if (docsStore.doc?.id === id) {
        configsStore.docEditMode = false
        router.push(`/${bookSlug.value}/home`)
      }
    }

    return result
  },
  onChangeTitle: async (event: Event, value: { id: number, title: string }): Promise<boolean> => {
    if (value.title && value.title.length > 0) {
      return await docsStore.docsApi.changeTitle(bookSlug.value, value.id, value.title)
    } else {
      return false
    }
  },
  onChangeParentId: async (event: Event, value: { id: number, parentId: number }): Promise<boolean> => {
    if (value.parentId && value.parentId > 0) {
      return await docsStore.docsApi.changeParentId(bookSlug.value, value.id, value.parentId)
    } else {
      return false
    }
  },
  /**
   * 
   * @param event 
   * @param value { _ 当前 id: number, 目标 targetId: number, -1 为上方，1 为下方 position: number }
   */
  onChangeSort: async (event: Event, value: { parentId: string, id: number, targetId: number, position: number }): Promise<boolean> => {
    let currentIndex = await docsStore.docsApi.findIndex(bookSlug.value, value.id) as number
    let aboveIndex = await docsStore.docsApi.findIndex(bookSlug.value, value.targetId) as number

    if (currentIndex === undefined || aboveIndex === undefined) {
      return false
    }

    if (currentIndex < aboveIndex) {
      if (value.position === -1) {
        aboveIndex = aboveIndex - 1
      }
    } else {
      if (value.position === 1) {
        aboveIndex = aboveIndex + 1
      }
    }

    const result = await docsStore.docsApi.splice(bookSlug.value, value.id, aboveIndex)
    if (!result) {
      Message.error(`置于${value.position > 0 ? '下方' : '上方'}失败`)
    }

    return result
  },

  onEditorChange: async function (event: Event, content: string, showSuccessTips?: boolean) {
    const doc = docsStore.doc as Doc;
    doc.content = content;
    doc.updateTime = new Date().getTime()
    if (await docsStore.docsApi.put(bookSlug.value, doc)) {
      if (showSuccessTips) {
        // 保留最近的 3 个通知
        if (historyNotification.length > 2) {
          historyNotification.shift()?.close()
        }

        const notificationInstance = Notification.success({
          title: '文档已保存',
          style: {
            top: '50px',
          },
        } as NotificationConfig)
        historyNotification.push(notificationInstance)
      }
    } else {
      Notification.error('文档保存失败')
    }
  }
}

// 监听路由变化
watch(route, async () => {
  loading.set(true)
  bookSlug.value = route.params.bookSlug as string;
  docSlug.value = route.params.docSlug as string;

  const refreshCurrentBookResult = await docsStore.refreshCurrentBook(bookSlug.value)
  if (!refreshCurrentBookResult) {
    console.warn('刷新当前知识库失败，跳回系统首页')
    configsStore.docEditMode = false
    router.push({ path: `/` });
    return
  }

  const book = docsStore.book as Book

  if (route.path === "/" + bookSlug.value || route.path === "/" + bookSlug.value + "/") {
    console.warn('知识库根路径，跳转知识库首页')
    configsStore.docEditMode = false
    router.push({ path: `/${bookSlug.value}/home` });
    return
  }

  const refreshCurrentDocResult = await docsStore.refreshCurrentDoc(bookSlug.value, docSlug.value)
  if (!refreshCurrentDocResult) {
    console.warn('刷新当前文档失败，跳回系统首页')
    configsStore.docEditMode = false
    router.push({ path: `/` });
    return
  }

  const doc = docsStore.doc as Doc

  // 判断当前路由是否存在，不存在就跳回首页
  if (doc.slug !== docSlug.value) {
    console.warn('当前文档不存在，跳转知识库首页')
    configsStore.docEditMode = false
    router.push({ path: `/${bookSlug.value}/home` });
    return
  }

  configsStore.setHeader('/', book.title);
  document.title = doc.title + ' - ' + book.title

  nextTick(() => {
    // 判断是否有锚点，没有的话就不滚动到页面顶部
    if (window.location.hash) {
      const anchor = document.querySelector(window.location.hash);
      anchor && anchor.scrollIntoView();
    } else {
      window.scrollTo(0, 0)
    }

    loading.set(false)
  })
}, { immediate: true });

watch(() => configsStore.docEditMode, async () => {
  if (configsStore.docEditMode === true) {
    loading.set(true)
    await docsStore.refreshCurrentDoc(bookSlug.value, docSlug.value, true)
    loading.set(false)
  }
})
</script>

<style scoped>
.content-view {
  background: var(--color-bg-1);
}

.docs__content.docs_content_word_editor {
  margin-left: 0;
  margin-right: 0;
  max-width: 100%;
  width: 100%;
}

.docs__content.docs_content_word_editor .docs__content-inner {
  max-width: 100%;
  width: 100%;
  padding: 0;
}
</style>
