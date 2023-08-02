<template>
  <div class="content-view" v-if="config.dir">
    <div class="docs">
      <CSidebar :space="space" :dir="config.dir" :active-path="route.path"
        :editor-type="config.currentDoc?.editor" @on-create="docsService.onCreate" @on-remove="docsService.onRemove"
        @on-change-title="docsService.onChangeTitle">
      </CSidebar>
      <template v-if="config.currentDoc">
        <div v-if="config.currentDoc.slug !== 'home'" class="docs__content"
          :class="configStore.docEditMode && config.currentDoc.editor === 'word' ? 'docs_content_word_editor' : ''">
          <div class="docs__content-inner">
            <template v-if="configStore.docEditMode">
              <CBlockEditor v-if="config.currentDoc.editor === 'block'" :space="space" :space-data="config.spaceData"
                :docs="config.spaceData[space].tree" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview" @on-change-title="docsService.onChangeTitle">
              </CBlockEditor>
              <CWordEditor v-else-if="config.currentDoc.editor === 'word'" :space="space" :space-data="config.spaceData"
                :docs="config.spaceData[space].tree" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview" @on-change-title="docsService.onChangeTitle">
              </CWordEditor>
            </template>
            <template v-else>
              <CBlockPreview v-if="config.currentDoc.editor === 'block'" :docs="config.spaceData[space].tree"
                :doc="config.currentDoc" @onEdit="configStore.docEditMode = true">
              </CBlockPreview>
              <CLinkPreview v-else-if="config.currentDoc.editor === 'link'" :docs="config.spaceData[space].tree"
                :doc="config.currentDoc" @onEdit="configStore.docEditMode = true">
              </CLinkPreview>
              <CWordPreview v-else :docs="config.spaceData[space].tree" :doc="config.currentDoc"
                @onEdit="configStore.docEditMode = true">
              </CWordPreview>
            </template>
          </div>

          <aside v-if="!configStore.docEditMode || config.currentDoc.editor !== 'word'" class="docs__aside-right">
            <COutline :doc="config.currentDoc" :edit-mode="configStore.docEditMode"></COutline>
          </aside>
        </div>
        <CHome :space="space" :title="config.spaceData[space].tree.title" :total-doc-count="config.totalDocCount" :total-word-count="config.totalWordCount" :docs="config.spaceData[space].tree" @on-change-title="docsService.onChangeTitle" v-else></CHome>
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
import CBlockPreview from "@/components/content/preview/ContentBlockPreview.vue";
import CWordPreview from "@/components/content/preview/ContentWordPreview.vue";
import CLinkPreview from "@/components/content/preview/ContentLinkPreview.vue";
import COutline from "@/components/content/ContentOutline.vue";
import { useRoute, useRouter } from "vue-router";
import { nextTick, reactive, watch } from "vue";
import { Message, Notification, type NotificationConfig, type NotificationReturn } from '@arco-design/web-vue';
import type { Doc, ContentViewConfig } from "@/types/global";
import { useDocsApi } from "@/api/docs";
import { useConfigStore } from "@/stores/config";

const route = useRoute();
const router = useRouter();
const configStore = useConfigStore();

const space = route.params.bookSlug as string;

const config: ContentViewConfig = reactive({
  dir: null,
  spaceData: {},
  currentDoc: null,
  totalDocCount: 0,
  totalWordCount: 0,
});

const docsApi = useDocsApi('localStorage', config.spaceData);

await docsApi.init(space);

const getCurrentDoc = function (data?: Doc[] | null): Doc | undefined {
  if (!data) {
    return;
  }

  for (const item of data) {
    if (item.path === route.path) {
      return JSON.parse(JSON.stringify(item));
    }

    if (item.child && item.child.length > 0) {
      const result = getCurrentDoc(item.child);
      if (result) {
        return result;
      }
    }
  }
};

// 监听路由变化
watch(route, async () => {
  if (route.path === "/" + space || route.path === "/" + space + "/") {
    router.push({ path: `/${space}/home` });
    return
  }
  // 判断当前路由是否存在，不存在就跳回首页
  else if (!getCurrentDoc([config.spaceData[space].tree])) {
    router.push({ path: `/${space}/home` });
    return
  }

  config.dir = await docsApi.dir(space);
  config.currentDoc = getCurrentDoc([config.spaceData[space].tree]);
  config.totalDocCount = await docsApi.getTotalDocCount(space);
  config.totalWordCount = await docsApi.getTotalWordCount(space);
  configStore.setHeader('/', config.spaceData[space].tree.title);
  if (config.currentDoc) {
    document.title = config.currentDoc.title + ' - ' + config.spaceData[space].tree.title
  } else {
    document.title = config.spaceData[space].tree.title
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
  if (await docsApi.put(space, doc)) {
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

    let level = await docsApi.getLevel(space, parentSlug)
    if (level && level > 2) {
      Message.error('暂时只支持两级目录')
      return
    }

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
      path: `/${space}/${slug}`,
      title: value?.title || "无标题文档",
      content,
      child: [],
      createTime: Date.now(),
      sort: (await docsApi.getTotalDocCount(space)) + 1
    };

    const result = await docsApi.put(space, doc);
    if (result) {
      router.push(doc.path)
      configStore.docEditMode = true
    }
    return result
  },
  onRemove: async (event: Event, slug: string): Promise<boolean> => {
    const result = await docsApi.remove(space, slug)
    if (result) {
      if (config.currentDoc?.slug === slug) {
        router.push(`/${space}`)
      }
    }

    return result
  },
  onChangeTitle: async (event: Event, slug: string, title: string): Promise<boolean> => {
    if (title && title.length > 0) {
      return await docsApi.changeTitle(space, slug, title)
    } else {
      return false
    }
  },
}

watch(() => config.currentDoc?.title, async () => {
  if (config.currentDoc?.slug) {
    config.currentDoc = await docsApi.get(space, config.currentDoc?.slug)
  }
})
</script>

<style scoped>
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
