<template>
  <div class="content-view" v-if="config.dir">
    <div class="docs">
      <CSidebar :space="bookSlug" :dir="config.dir" :editor-type="config.currentDoc?.editor"
        @on-create="docsService.onCreate" @on-copy="docsService.onCopy" @on-remove="docsService.onRemove"
        @on-change-title="docsService.onChangeTitle" @on-change-parent-slug="docsService.onChangeParentSlug"
        @on-change-sort="docsService.onChangeSort">
      </CSidebar>
      <template v-if="config.currentDoc">
        <div v-if="config.currentDoc.slug !== 'home'" class="docs__content"
          :class="configStore.docEditMode && config.currentDoc.editor === 'word' ? 'docs_content_word_editor' : ''">
          <div class="docs__content-inner">
            <template v-if="configStore.docEditMode">
              <CBlockEditor v-if="config.currentDoc.editor === 'block'" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview"
                @on-change-title="docsService.onChangeTitle">
              </CBlockEditor>
              <CWordEditor v-else-if="config.currentDoc.editor === 'word'" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview"
                @on-change-title="docsService.onChangeTitle">
              </CWordEditor>
            </template>
            <template v-else>
              <CPreview :docs="config.spaceData[bookSlug].tree" :doc="config.currentDoc"
                @onEdit="configStore.docEditMode = true">
              </CPreview>
            </template>
          </div>

          <aside v-if="!configStore.docEditMode || config.currentDoc.editor !== 'word'" class="docs__aside-right">
            <COutline :doc="config.currentDoc" :edit-mode="configStore.docEditMode"></COutline>
          </aside>
        </div>
        <CHome :space="bookSlug" :title="config.spaceData[bookSlug].tree.title" :total-doc-count="config.totalDocCount"
          :total-word-count="config.totalWordCount" :docs="config.spaceData[bookSlug].tree"
          @on-change-title="docsService.onChangeTitle" v-else></CHome>
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
import { nextTick, reactive, watch } from "vue";
import { Message, Notification, type NotificationConfig, type NotificationReturn } from '@arco-design/web-vue';
import type { Doc, ContentViewConfig, Book } from "@/types/global";
import { useBooksApi } from "@/api/books";
import { useDocsApi } from "@/api/docs";
import { useUserStore } from '@/stores/user';
import { useConfigStore } from "@/stores/config";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const configStore = useConfigStore();

const bookSlug = route.params.bookSlug as string;

const config: ContentViewConfig = reactive({
  dir: null,
  spaceData: {},
  currentDoc: null,
  totalDocCount: 0,
  totalWordCount: 0,
});

const booksApi = useBooksApi('localStorage');
const docsApi = useDocsApi('localStorage', config.spaceData);

await docsApi.init(bookSlug);

// 监听路由变化
watch(route, async () => {
  const slug = route.params.docSlug as string;
  const doc = await docsApi.get(bookSlug, slug);

  if (route.path === "/" + bookSlug || route.path === "/" + bookSlug + "/") {
    router.push({ path: `/${bookSlug}/home` });
    return
  }
  // 判断当前路由是否存在，不存在就跳回首页
  else if (doc?.slug !== slug) {
    router.push({ path: `/${bookSlug}/home` });
    return
  }

  config.dir = await docsApi.dir(bookSlug);
  config.currentDoc = doc;

  if (doc.slug === 'home') {
    config.totalDocCount = await docsApi.getTotalDocCount(bookSlug);
    config.totalWordCount = await docsApi.getTotalWordCount(bookSlug);
  }

  const books = await booksApi.get(bookSlug) as Book
  configStore.setHeader('/', books.title);
  if (config.currentDoc) {
    document.title = config.currentDoc.title + ' - ' + books.title
  } else {
    document.title = books.title
  }
}, { immediate: true });

watch(route, () => {
  nextTick(() => {
    // 判断是否有锚点，没有的话就不滚动到页面顶部
    if (window.location.hash) {
      const anchor = document.querySelector(window.location.hash);
      anchor && anchor.scrollIntoView();
    } else {
      window.scrollTo(0, 0)
    }
  })
}, { immediate: true })

let historyNotification = [] as NotificationReturn[]
const onEditorChange = async function (event: Event, content: any, showSuccessTips?: boolean) {
  const doc = config.currentDoc as Doc;
  doc.content = content;
  doc.updateTime = new Date().getTime()
  if (await docsApi.put(bookSlug, doc)) {
    if (showSuccessTips) {
      // 保留最近的 3 个通知
      if (historyNotification.length > 2) {
        historyNotification.shift()?.close()
      }

      const notificationInstance = Notification.success({
        title: '文档已保存'
      } as NotificationConfig)
      historyNotification.push(notificationInstance)
    }
  } else {
    Notification.error('文档保存失败')
  }
};

const onPreview = function () {
  configStore.docEditMode = false;
};

const docsService = {
  onCreate: async (event: Event, value: Doc | undefined) => {
    if (value === undefined || value === null) {
      return false
    }

    const slug = await docsApi.generateSlug(12)
    let parentSlug = value?.parentSlug
    if (parentSlug === undefined || parentSlug.length <= 0) {
      parentSlug = config.currentDoc?.slug || "home";
    }

    parentSlug = parentSlug === 'home' ? 'root' : parentSlug

    let content;
    if (value?.editor === 'word') {
      content = value?.content || ''
    } else if (value?.editor === 'link') {
      content = value?.content || ''
    } else {
      content = value?.content || [
        {
          type: "header",
          data: {
            text: "",
            level: 2,
          },
        },
      ]
    }

    const doc: Doc = {
      id: Math.ceil(Math.random() * 100000000000000),
      slug,
      parentSlug,
      editor: value?.editor || "block",
      path: `/${bookSlug}/${slug}`,
      title: value?.title || "无标题文档",
      content,
      child: [],
      creator: userStore.name + userStore.id,
      createTime: Date.now(),
      sort: (await docsApi.getTotalDocCount(bookSlug)) + 1
    };

    const result = await docsApi.put(bookSlug, doc);
    if (result) {
      router.push(doc.path)
      configStore.docEditMode = true
    }
    return result
  },
  onCopy: async (event: Event, value: { slug: string }) => {
    if (!value?.slug) {
      return
    }

    const doc = await docsApi.get(bookSlug, value.slug) as Doc
    if (doc) {
      docsService.onCreate(event, {
        parentSlug: doc.parentSlug,
        title: `${doc.title} - 副本`,
        editor: doc.editor,
        content: doc.content
      } as Doc)
    }
  },
  onRemove: async (event: Event, slug: string): Promise<boolean> => {
    const result = await docsApi.remove(bookSlug, slug)
    if (result) {
      if (config.currentDoc?.slug === slug) {
        router.push(`/${bookSlug}`)
      }
    }

    return result
  },
  onChangeTitle: async (event: Event, value: { slug: string, title: string }): Promise<boolean> => {
    if (value.title && value.title.length > 0) {
      return await docsApi.changeTitle(bookSlug, value.slug, value.title)
    } else {
      return false
    }
  },
  onChangeParentSlug: async (event: Event, value: { slug: string, parentSlug: string }): Promise<boolean> => {
    if (value.parentSlug && value.parentSlug.length > 0) {
      return await docsApi.changeParentSlug(bookSlug, value.slug, value.parentSlug)
    } else {
      return false
    }
  },
  /**
   * 
   * @param event 
   * @param value { _ 当前 slug: string, 目标 targetSlug: string, -1 为上方，1 为下方 position: number }
   */
  onChangeSort: async (event: Event, value: { parentSlug: string, slug: string, targetSlug: string, position: number }): Promise<boolean> => {
    let currentIndex = await docsApi.findIndex(bookSlug, value.slug) as number
    let aboveIndex = await docsApi.findIndex(bookSlug, value.targetSlug) as number

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

    const result = await docsApi.splice(bookSlug, value.slug, aboveIndex)
    if (!result) {
      Message.error(`置于${value.position > 0 ? '下方' : '上方'}失败`)
    }

    return result
  }
}


watch(() => config.currentDoc?.title, async () => {
  if (config.currentDoc?.slug) {
    config.currentDoc = await docsApi.get(bookSlug, config.currentDoc?.slug)
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
