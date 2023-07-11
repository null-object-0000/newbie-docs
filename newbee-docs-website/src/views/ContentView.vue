<template>
  <div class="content-view">
    <CHeader :docs="docs"></CHeader>

    <div class="docs">
      <CSidebar :docs="docs" :active-path="route.path" :editor-type="config.editorType"></CSidebar>
      <div class="docs__content"
        :class="config.editMode && config.editorType === 'word' ? 'docs_content_word_editor' : ''"
        v-if="config.currentDoc">
        <div class="docs__content-inner">
          <CBlockEditor v-if="config.editMode && config.editorType === 'block'" :docs="docs"
            :editor-config="{ headerPlaceholder: '请输入标题' }" :doc="config.currentDoc" @on-change="onEditorChange">
          </CBlockEditor>
          <CWordEditor v-if="config.editMode && config.editorType === 'word'"
            :editor-config="{ headerPlaceholder: '请输入标题' }" :doc="config.currentDoc" @on-change="onEditorChange">
          </CWordEditor>

          <CPreview v-if="!config.editMode" :doc="config.currentDoc" @onEdit="config.editMode = true"></CPreview>
        </div>

        <aside v-if="!config.editMode || config.editorType !== 'word'" class="docs__aside-right">
          <COutline :doc="config.currentDoc"></COutline>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@/assets/docs-main.css";
import "@/assets/docs-code-styling.css";

import CHeader from "@/components/content/ContentHeader.vue";
import CSidebar from "@/components/content/ContentSidebar.vue";
import CBlockEditor from "@/components/content/editor/ContentBlockEditor.vue";
import CWordEditor from "@/components/content/editor/ContentWordEditor.vue";
import CPreview from "@/components/content/ContentPreview.vue";
import COutline from "@/components/content/ContentOutline.vue";
import { useRoute, useRouter } from "vue-router";
import { reactive, watch } from "vue";

import type { Doc, ContentViewConfig } from "@/types/global";
import { useDocsStore } from "@/stores/docs";

const route = useRoute();
const router = useRouter();

const space = route.params.space as string;

const docsStore = useDocsStore()

const docs = docsStore.get(space);

// 给所有的 doc 添加 parent 属性 并默认展开所有的 doc
const initDocs = function (data: Doc[], parent?: Doc) {
  for (const item of data) {
    item.parent = parent;
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
      initDocs(item.child, item);
    }
  }
};
initDocs([docs]);

const getCurrentDoc = function (data: Doc[]): Doc | undefined {
  for (const item of data) {
    if (item.path === route.path) {
      return item;
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

  config.currentDoc = getCurrentDoc([docs]);
  config.editMode = false;
}, { immediate: true });

const onEditorChange = function (event: Event, blocks: any) {
  const doc = config.currentDoc as Doc;
  doc.blocks = blocks;
  docsStore.put(space, doc)
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
