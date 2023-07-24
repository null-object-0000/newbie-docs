<template>
  <div class="content-view">
    <CHeader :docs="config.spaceData[space].tree" @on-create="onCreate"></CHeader>

    <div class="docs">
      <CSidebar :docs="config.spaceData[space].tree" :active-path="route.path" :editor-type="config.currentDoc?.editor"
        @on-create="onCreate">
      </CSidebar>
      <template v-if="config.currentDoc">
        <div v-if="config.currentDoc.id !== 'home'" class="docs__content"
          :class="config.editMode && config.currentDoc.editor === 'word' ? 'docs_content_word_editor' : ''">
          <div class="docs__content-inner">
            <template v-if="config.editMode">
              <CBlockEditor v-if="config.currentDoc.editor === 'block'" :space="space" :space-data="config.spaceData"
                :docs="config.spaceData[space].tree" :editor-config="{ headerPlaceholder: '请输入标题' }"
                :doc="config.currentDoc" @on-change="onEditorChange" @on-preview="onPreview">
              </CBlockEditor>
              <CWordEditor v-else-if="config.currentDoc.editor === 'word'">
              </CWordEditor>
            </template>
            <CPreview v-else :docs="config.spaceData[space].tree" :doc="config.currentDoc"
              @onEdit="config.editMode = true">
            </CPreview>
          </div>

          <aside v-if="!config.editMode || config.currentDoc.editor !== 'word'" class="docs__aside-right">
            <COutline :doc="config.currentDoc"></COutline>
          </aside>
        </div>
        <CHome :docs="config.spaceData[space].tree" v-else></CHome>
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

import { Message } from '@arco-design/web-vue';

import type { Doc, ContentViewConfig } from "@/types/global";
import { useDocsApi } from "@/api/docs";

const route = useRoute();
const router = useRouter();

const space = route.params.space as string;

const config: ContentViewConfig = reactive({
  spaceData: {},
  currentDoc: null,
  editMode: false,
});

const docsApi = useDocsApi('localStorage', config.spaceData);

docsApi.init(space);

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

config.currentDoc = getCurrentDoc([config.spaceData[space].tree]);

// 监听路由变化
watch(route, () => {
  if (route.path === "/" + space || route.path === "/" + space + "/") {
    router.push({ path: `/${space}/home` });
  }
  // 判断当前路由是否存在，不存在就跳回首页
  else if (!getCurrentDoc([config.spaceData[space].tree])) {
    router.push({ path: `/${space}/home` });
  }

  config.currentDoc = getCurrentDoc([config.spaceData[space].tree]);
}, { immediate: true });

const onEditorChange = function (event: Event, blocks: any) {
  const doc = config.currentDoc as Doc;
  doc.blocks = blocks;
  console.log('onEditorChange', 'doc', doc.parentId)
  docsApi.put(space, doc);
};

const onCreate = function () {
  const id = docsApi.generateId(12)
  console.log('onCreate', 'id', id)

  let parentId = config.currentDoc?.id || "home";
  parentId = parentId === 'home' ? 'root' : parentId

  let level = docsApi.getLevel(space, parentId)
  if (level && level > 2) {
    Message.error('暂时只支持两级目录')
    return
  }

  const doc: Doc = {
    id,
    parentId,
    // TODO: 临时写死，后续需要根据用户选择的编辑器类型来决定
    editor: "block",
    path: `/${space}/${id}`,
    title: "无标题文档",
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

  docsApi.put(space, doc);

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
