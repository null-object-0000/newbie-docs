<template>
  <div class="content-view" v-if="config.dir">
    <div class="docs">
      <CSidebar :space="bookSlug" :dir="config.dir" @on-create="docsService.onCreate" @on-copy="docsService.onCopy"
        @on-remove="docsService.onRemove" @on-change-title="docsService.onChangeTitle"
        @on-change-parent-slug="docsService.onChangeParentSlug" @on-change-sort="docsService.onChangeSort">
      </CSidebar>
      <template v-if="config.currentDoc">
        <div v-if="config.currentDoc.slug !== 'home'" class="docs__content"
          :class="configsStore.docEditMode && config.currentDoc.editor === 1 ? 'docs_content_word_editor' : ''">
          <div class="docs__content-inner">
            <template v-if="configsStore.docEditMode">
              <CBlockEditor v-if="config.currentDoc.editor === 2" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview"
                @on-change-title="docsService.onChangeTitle">
              </CBlockEditor>
              <CWordEditor v-else-if="config.currentDoc.editor === 1" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview"
                @on-change-title="docsService.onChangeTitle">
              </CWordEditor>
            </template>
            <template v-else>
              <CPreview :docs="config.spaceData[bookSlug].tree" :doc="config.currentDoc"
                @onEdit="configsStore.docEditMode = true">
              </CPreview>
            </template>
          </div>

          <aside v-if="!configsStore.docEditMode || config.currentDoc.editor !== 1" class="docs__aside-right">
            <COutline :doc="config.currentDoc" :edit-mode="configsStore.docEditMode"></COutline>
          </aside>
        </div>
        <CHome v-else :space="bookSlug" :total-doc-count="config.totalDocCount" :total-word-count="config.totalWordCount">
        </CHome>
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
import { useUsersStore } from '@/stores/user';
import { useConfigsStore } from "@/stores/config";
import { OutputBlockData } from "@editorjs/editorjs";

const route = useRoute();
const router = useRouter();
const { loginUser } = useUsersStore();
const configsStore = useConfigsStore();

const bookSlug = route.params.bookSlug as string;

const config: ContentViewConfig = reactive({
  dir: null,
  spaceData: {},
  currentBook: null,
  currentDoc: null,
  totalDocCount: 0,
  totalWordCount: 0,
});

const booksApi = useBooksApi('localStorage');
const docsApi = useDocsApi('localStorage', config.spaceData);

// 监听路由变化
watch(route, async () => {
  const bookSlug = route.params.bookSlug as string;
  const slug = route.params.docSlug as string;
  const book = await booksApi.get(bookSlug) as Book

  if (book === null) {
    router.push({ path: `/` });
  } else {
    await docsApi.init(bookSlug);
  }

  if (book === undefined || book === null) {
    router.push({ path: `/` });
    return
  }

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
  config.currentBook = book;
  config.currentDoc = doc;

  if (doc.slug === 'home') {
    config.totalDocCount = await docsApi.getTotalDocCount(bookSlug);
    config.totalWordCount = await docsApi.getTotalWordCount(bookSlug);
  }

  configsStore.setHeader('/', book.title);
  if (config.currentDoc) {
    document.title = config.currentDoc.title + ' - ' + book.title
  } else {
    document.title = book.title
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
const onEditorChange = async function (event: Event, content: string, showSuccessTips?: boolean) {
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
};

const onPreview = function () {
  configsStore.docEditMode = false;
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
    if (value?.editor === 1) {
      content = value?.content || ''
    } else if (value?.editor === 3) {
      content = value?.content || ''
    } else {
      content = value?.content || JSON.stringify([
        {
          type: "header",
          data: {
            text: "",
            level: 2,
          },
        },
      ] as OutputBlockData[])
    }

    const book = await booksApi.get(bookSlug) as Book

    const doc: Doc = {
      bookId: book.id as number,
      bookSlug: book.slug,

      slug,
      parentSlug,
      editor: value?.editor || 2,
      path: `/${bookSlug}/${slug}`,
      title: value?.title || "无标题文档",
      content,
      children: [],
      creator: loginUser.username + loginUser.id,
      createTime: Date.now(),
      sort: (await docsApi.getTotalDocCount(bookSlug)) + 1
    };

    const result = await docsApi.put(bookSlug, doc);
    if (result) {
      router.push(doc.path)
      configsStore.docEditMode = true
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
