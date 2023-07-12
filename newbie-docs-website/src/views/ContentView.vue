<template>
  <div class="content-view">
    <CHeader :docs="docs" @on-create="onCreate"></CHeader>

    <div class="docs">
      <CSidebar :docs="docs" :active-path="route.path" :editor-type="config.editorType" @on-create="onCreate"></CSidebar>
      <template v-if="config.currentDoc">
        <div v-if="config.currentDoc.id !== 'home'" class="docs__content"
          :class="config.editMode && config.editorType === 'word' ? 'docs_content_word_editor' : ''">
          <div class="docs__content-inner">
            <CBlockEditor v-if="config.editMode && config.editorType === 'block'" :docs="docs"
              :editor-config="{ headerPlaceholder: '请输入标题' }" :doc="config.currentDoc" @on-change="onEditorChange"
              @on-preview="onPreview">
            </CBlockEditor>
            <CWordEditor v-if="config.editMode && config.editorType === 'word'">
            </CWordEditor>

            <CPreview v-if="!config.editMode" :docs="docs" :doc="config.currentDoc" @onEdit="config.editMode = true">
            </CPreview>
          </div>

          <aside v-if="!config.editMode || config.editorType !== 'word'" class="docs__aside-right">
            <COutline :doc="config.currentDoc"></COutline>
          </aside>
        </div>
        <CHome :docs="docs" v-else></CHome>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@/assets/docs-main.css";
import "@/assets/docs-code-styling.css";

import CHome from "@/components/content/ContentHome.vue";
import CHeader from "@/components/content/ContentHeader.vue";
import CSidebar from "@/components/content/ContentSidebar.vue";
import CBlockEditor from "@/components/content/editor/ContentBlockEditor.vue";
import CWordEditor from "@/components/content/editor/ContentWordEditor.vue";
import CPreview from "@/components/content/ContentPreview.vue";
import COutline from "@/components/content/ContentOutline.vue";
import { useRoute, useRouter } from "vue-router";
import { nextTick, reactive, watch } from "vue";

import type { Doc, ContentViewConfig } from "@/types/global";
import { useDocsStore } from "@/stores/docs";

const route = useRoute();
const router = useRouter();

const space = route.params.space as string;

const docsStore = useDocsStore()

const docs = docsStore.get(space);

// 给所有的 doc 添加 parent 属性 并默认展开所有的 doc
const initDocs = function (data: Doc[]) {
  for (const item of data) {
    item.expand = true;
    item.blocks = item.blocks || [
      {
        type: "header",
        data: {
          text: item.title,
          level: 2,
        },
      },
    ];

    if (item.child && item.child.length > 0) {
      initDocs(item.child);
    }
  }
};
initDocs([docs]);

const getCurrentDoc = function (data: Doc[]): Doc | undefined {
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

const config: ContentViewConfig = reactive({
  currentDoc: getCurrentDoc([docs]),
  editMode: false,
  editorType: 'block',
});

// 监听路由变化
watch(route, () => {
  if (route.path === "/" + space || route.path === "/" + space + "/") {
    router.push({ path: `/${space}/home` });
  }
  // 判断当前路由是否存在，不存在就跳回首页
  else if (!getCurrentDoc([docs])) {
    router.push({ path: `/${space}/home` });
  }

  config.currentDoc = getCurrentDoc([docs]);
}, { immediate: true });

const onEditorChange = function (event: Event, blocks: any) {
  const doc = config.currentDoc as Doc;
  doc.blocks = blocks;
  docsStore.put(space, doc)
};

const onCreate = function () {
  const id = docsStore.generateId(12)
  console.log('onCreate', 'id', id)

  let parentId = config.currentDoc?.id || "home";

  const doc: Doc = {
    id,
    path: `/${space}/${id}`,
    title: "无标题文档",
    parentId: parentId === 'home' ? 'root' : parentId,
    blocks: [
      {
        type: "header",
        data: {
          text: "",
          level: 2,
        },
      },
    ],
    child: []
  };

  docsStore.put(space, doc)
  router.push(doc.path)
  config.editMode = true
};

const onPreview = function () {
  config.editMode = false;
};
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
