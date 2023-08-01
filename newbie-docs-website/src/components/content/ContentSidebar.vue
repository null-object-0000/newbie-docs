<template>
  <div data-module="sidebar" class="docs-sidebar docs-sidebar--animated"
    :class="sidebar.collapsed ? 'docs-sidebar--collapsed' : ''" ref="sidebarRef">
    <aside class="docs-sidebar__content">
      <span class="docs-sidebar__search-wrapper" :data-shortcut="shortcutText">
        <a-input ref="searchInputRef" v-model="keyword" @input="search" class="docs-sidebar__search" type="text"
          placeholder="搜索" />

        <a-dropdown trigger="hover" position="bl" @select="createDoc">
          <a-button class="docs-sidebar__create" type="outline">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
          <template #content>
            <a-doption value="block"><template #icon><icon-code-block /></template>Block</a-doption>
            <a-doption value="word"><template #icon><icon-file /></template>Word</a-doption>
            <a-doption disabled value="link"><template #icon><icon-link /></template>Link</a-doption>
          </template>
        </a-dropdown>
      </span>
      <template v-for="(rootItem) of docs.child">
        <section class="docs-sidebar__section" :key="rootItem.id"
          v-if="keywordIncludes(rootItem.title) || keywordIncludes(rootItem?.child?.map(i => i.title))"
          :class="rootItem.expand ? '' : 'docs-sidebar__section--animated docs-sidebar__section--collapsed'">
          <SideBarTitle :is-list="false" :edit-mode="renameDocId === rootItem.id" :item="rootItem"
            :active="rootItemIsActive(rootItem) && renameDocId !== rootItem.id" :keyword="keyword" @on-create="onCreate"
            @on-setting="onSetting" @on-renamed="onRenamed"></SideBarTitle>
          <ul
            v-if="rootItem.child && rootItem.child.length > 0 && rootItem.expand && keywordIncludes(rootItem.child.map(i => i.title))"
            class="docs-sidebar__section-list" :style="{ 'max-height': `${31 * rootItem.child.length}px` }">
            <template v-for="(item) of rootItem.child" :key="item.id">
              <li v-if="keywordIncludes(item.title)">
                <SideBarTitle :is-list="true" :edit-mode="renameDocId === item.id" :item="item"
                  :active="item.path === activePath" :keyword="keyword" @on-create="onCreate" @on-setting="onSetting"
                  @on-renamed="onRenamed"></SideBarTitle>
              </li>
            </template>
          </ul>
        </section>
      </template>
    </aside>

    <div v-if="editorType !== 'word'" class="docs-sidebar__slider" @click="sidebar.collapsed = !sidebar.collapsed">
      <docs-icon-arrow-left />
    </div>
  </div>

  <a-modal v-model:visible="linkModalData.visible" title="链接" @ok="createLinkDoc">
    <a-form :model="linkModalData.form" auto-label-width>
      <a-form-item field="url" label="Url"
        :rules="[{ required: true, message: '请输入 url' }, { type: 'url', message: '请输入完整有效的 url' }]">
        <a-input v-model="linkModalData.form.url" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, toRefs, type PropType } from "vue";
import type { Doc } from "@/types/global";
import { useMagicKeys, whenever } from '@vueuse/core'
import SideBarTitle from "./SidebarTitle.vue";
import { useClipboard } from '@vueuse/core'
import { Message } from "@arco-design/web-vue";
import { useDocsApi } from "@/api/docs";
import { useConfigStore } from "@/stores/config";
import { useRouter } from "vue-router";
import { Modal } from '@arco-design/web-vue';

const router = useRouter();
const configStore = useConfigStore();

const sidebarRef = ref(null)
const source = ref('')
const clipboard = useClipboard({ source })

const { ctrl_j } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 'j' && e.type === 'keydown') {
      e.preventDefault()
    }
  },
})

const searchInputRef = ref<HTMLElement | null>(null)

whenever(ctrl_j, () => {
  // 激活 class 等于 docs-sidebar__search 的输入框
  searchInputRef.value?.focus()
})

const props = defineProps({
  space: {
    type: String,
    required: true,
  },
  spaceData: {
    type: Object,
    required: true,
  },
  docs: {
    type: Object as PropType<Doc>,
    required: true,
  },
  activePath: {
    type: String,
    required: false
  },
  editorType: {
    type: String,
    required: false
  }
});

const emit = defineEmits(["onCreate"]);

const { docs, activePath } = toRefs(props);

const { space, spaceData } = toRefs(props);

const docsApi = useDocsApi('localStorage', spaceData.value)

const sidebar = reactive({
  collapsed: false,
});

const linkModalData = reactive({
  visible: false,
  form: {
    url: '',
  }
})

let shortcutText = ref('Ctrl + J');

// Search initialize with platform specific shortcut.
if (window.navigator.userAgent.indexOf('Mac') !== -1) {
  shortcutText.value = '⌘ + J';
}

const keyword = ref('');
const search = () => {
  // 基于 keyword 过滤展示的 docs
};

const keywordIncludes = function (str?: string | string[]): boolean {
  if (str === undefined) {
    return false
  }

  if (keyword.value.length <= 0) {
    return true
  }

  if (Array.isArray(str)) {
    return str.some(i => keywordIncludes(i));
  } else {
    return str.toLowerCase().indexOf(keyword.value.toLowerCase()) !== -1;
  }
}

const rootItemIsActive = function (rootItem: Doc): boolean {
  // 判断是否被折叠
  if (rootItem.expand || !rootItem.child) {
    return rootItem.path === activePath?.value;
  }

  if (rootItem.path === activePath?.value) {
    return true
  } else {
    // 判断子集是否有被激活的
    return rootItem.child.some(i => i.path === activePath?.value);
  }
}

const createDoc = function (value: string | number | Record<string, any> | undefined, ev: Event) {
  if (value === 'link') {
    linkModalData.visible = true
    return
  }

  onCreate(ev, { parentId: 'root', editor: value as string });
}

const onCreate = function (ev: Event, value: { parentId?: string, editor: string, content?: any } | undefined) {
  emit("onCreate", ev, value);
};

const renameDocId = ref('')
const onSetting = async function (ev: Event, value: { id: string, doc: Doc, action: string | number | Record<string, any> | undefined }) {
  const docLink = `${location.protocol}//${location.host}${value.doc.path}`
  if (value.action === 'rename') {
    renameDocId.value = value.doc.id
  } else if (value.action === 'edit') {
    router.push(value.doc.path)
    configStore.docEditMode = true
  } else if (value.action === 'copy') {
    const newDoc = JSON.parse(JSON.stringify(value.doc))
    newDoc.id = await docsApi.generateId(12)
    newDoc.title = `${newDoc.title} - 副本`
    newDoc.child = []
    newDoc.path = `/${space.value}/${newDoc.id}`
    await docsApi.put(space.value, newDoc)
    router.push(newDoc.path)
  } else if (value.action === 'delete') {
    Modal.warning({
      title: `确认框`,
      simple: true,
      content: `确认删除 ${value.doc.title} 吗？`,
      hideCancel: false,
      onOk: async () => {
        await docsApi.remove(space.value, value.doc.id)
        if (value.doc.path === activePath?.value) {
          router.push(`/${space.value}`)
        }
      }
    })
  } else if (value.action === 'copyLink') {
    clipboard.copy(docLink)
    Message.success('链接复制成功')
  } else if (value.action === 'openLink') {
    window.open(docLink)
  }
}

const onRenamed = async function (ev: Event, value: { id: string, doc: Doc, title: string }) {
  if (value.title && value.title.length > 0) {
    await docsApi.changeTitle(space.value, value.id, value.title)
  }

  renameDocId.value = ''
}

const createLinkDoc = function (ev: Event) {
  onCreate(ev, { editor: 'link', content: linkModalData.form.url });
}
</script>

<style scoped>
.docs-sidebar__search-wrapper:after {
  margin-left: -105px;
  margin-top: 10px;
}

.docs-sidebar__search-wrapper {
  display: flex;
  margin-bottom: 15px;
}

.docs-sidebar__search {
  display: flex;
  width: calc(100% - 32px);
  height: 34px;
}

.docs-sidebar__create {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  margin: 0 0 0 12px;
  cursor: pointer;
  transition: background .35s ease-in-out;
  background-color: #FFFFFF;
  border: 1px solid #E7E9E8;
}

.docs-sidebar__create svg {
  color: #585A5A;
  width: 16px;
  min-width: 16px;
  height: 16px;
}

.docs-sidebar-link {
  cursor: pointer;
}

.docs-sidebar__section {
  margin-top: 5px;
}
</style>
