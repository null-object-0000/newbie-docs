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

      <a-tree draggable block-node class="docs-sidebar__tree" v-if="sidebarData.dir" :data="sidebarData.dir"
        v-model:selected-keys="sidebarData.selectedKeys" :allow-drop="checkIsAllowDrop"
        @select="(selectedKeys, { node }) => jump2Doc(node?.key, false)">
        <template #title="node">
          <span class="docs-sidebar__tree-node"
            :class="[sidebarData.renameDocSlug === node.key ? 'docs-sidebar__tree-node-editor-mode' : '']"
            @mouseover="sidebarData.hoverNode = node.key">
            <span v-if="node.key === `/${space}/home` || sidebarData.renameDocSlug !== node.key"
              class="docs-sidebar__tree-node-title">
              <template v-if="getMatchIndex(node?.title) < 0">{{ node?.title }}</template>
              <span v-else>
                <span>{{ node?.title?.substr(0, getMatchIndex(node?.title)) }}</span>
                <span style="color: var(--color-primary-light-4); font-weight: 700;">
                  {{ node?.title?.substr(getMatchIndex(node?.title), keyword.length) }}
                </span>
                <span>{{ node?.title?.substr(getMatchIndex(node?.title) + keyword.length) }}</span>
              </span>

            </span>
            <a-input size="small" ref="renameInputRef" v-model="sidebarData.docTitle" style="height: 26px;"
              @blur="ev => onRenamed(ev, node)" v-else>
              <template #append>
                <icon-check @click="ev => onRenamed(ev, node)"></icon-check>
              </template>
            </a-input>

            <template v-if="node.key !== `/${space}/home` && sidebarData.renameDocSlug !== node.key">
              <a-dropdown trigger="click" @select="(value, ev) => onSetting(node, value, ev)" :popup-max-height="false"
                @popup-visible-change="visible => visible ? null : sidebarData.hoverNode = null">
                <icon-more-vertical class="docs-sidebar__tree-node-tools" @click="eventStopPropagation"
                  :style="{ visibility: sidebarData.hoverNode === node.key ? 'visible' : 'hidden' }" />
                <template #content>
                  <a-doption value="rename"><template #icon><icon-loop /></template>重命名</a-doption>
                  <a-doption value="edit"><template #icon><icon-edit /></template>编辑文档</a-doption>
                  <a-doption value="copyLink"><template #icon><icon-link /></template>复制链接</a-doption>
                  <a-doption value="openLink"><template #icon><icon-launch /></template>在新标签页打开</a-doption>
                  <a-doption value="copy"><template #icon><icon-copy /></template>复制</a-doption>
                  <a-doption value="delete" :style="{ color: 'rgb(var(--danger-6))' }">
                    <template #icon><icon-delete /></template>删除
                  </a-doption>
                </template>
              </a-dropdown>
              <a-dropdown trigger="click" @select="(value, ev) => onCreate(node, value, ev)"
                @popup-visible-change="visible => visible ? null : sidebarData.hoverNode = null">
                <icon-plus class="docs-sidebar__tree-node-tools" @click="eventStopPropagation"
                  :style="{ visibility: sidebarData.hoverNode === node.key ? 'visible' : 'hidden' }" />
                <template #content>
                  <a-doption value="block"><template #icon><icon-code-block /></template>Block</a-doption>
                  <a-doption value="word"><template #icon><icon-file /></template>Word</a-doption>
                  <a-doption disabled value="link"><template #icon><icon-link /></template>Link</a-doption>
                </template>
              </a-dropdown>
            </template>
          </span>
        </template>
        <template #extra="node">
          <icon-home style="position: absolute;" v-if="node.key === `/${space}/home`" />
        </template>
        <template #drag-icon="node">

        </template>
      </a-tree>
    </aside>

    <div v-if="editorType !== 'word'" class="docs-sidebar__slider" @click="sidebar.collapsed = !sidebar.collapsed">
      <docs-icon-arrow-left />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, toRefs, watch, nextTick, type PropType } from "vue";
import type { Doc } from "@/types/global";
import { useMagicKeys, whenever, useClipboard } from '@vueuse/core'
import { Message, Modal, type TreeNodeData } from "@arco-design/web-vue";
import { useConfigStore } from "@/stores/config";
import { useDocsEventBus } from "@/events/docs";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const configStore = useConfigStore();
const docsEventBus = useDocsEventBus()

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
  dir: {
    type: Object as PropType<Doc>,
    required: true,
  },
  editorType: {
    type: String,
    required: false
  }
});

const emit = defineEmits(["onCreate", 'onCopy', "onRemove", "onChangeTitle"]);

const { space, dir } = toRefs(props);

const renameInputRef = ref<HTMLElement | null>(null)
const sidebarData = reactive({
  rawDir: [],
  fullDir: [],
  dir: [],
  selectedKeys: [],
  editMode: false,
  hoverNode: null,
  renameDocSlug: '',
  docTitle: ''
} as {
  rawDir: Doc[],
  fullDir: TreeNodeData[],
  dir: TreeNodeData[],
  selectedKeys: Array<string | number>,
  editMode: boolean,
  hoverNode: string | null,
  renameDocSlug: string,
  docTitle: string
});

const formatDirData = (dir: Doc[]): TreeNodeData[] => {
  return dir.map(item => {
    const node = {} as TreeNodeData

    if (item.child && item.child.length > 0) {
      node.children = formatDirData(item.child)
    }

    node.key = `/${space.value}/${item.slug}`
    node.title = item.title
    if (node.key === `/${space.value}/home`) {
      node.draggable = false
    }

    return node
  })
}

const updateDirData = (dir?: Doc) => {
  sidebarData.rawDir = dir?.child || []
  sidebarData.dir = formatDirData(sidebarData.rawDir)
  sidebarData.fullDir = JSON.parse(JSON.stringify(sidebarData.dir))

  search()
}

docsEventBus.onDirChange(space.value, (event: Event, value: { space: string, dir: Doc }) => {
  updateDirData()
  updateDirData(value.dir)
  console.log('onDirChange', event, value)
})

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
  console.log('search.keyword', keyword.value)

  const loop = (data: TreeNodeData[]) => {
    const result = [] as TreeNodeData[];
    data.forEach(item => {
      if (item.key === `/${space.value}/home`) {
        result.push({ ...item });
        return;
      }


      if (item.title && item.title.toLowerCase().indexOf(keyword.value.toLowerCase()) > -1) {
        item.children = item.children ? loop(item.children) : [];
        result.push({ ...item });
      } else if (item.children) {
        const filterData = loop(item.children);
        if (filterData.length) {
          result.push({
            ...item,
            children: filterData
          })
        }
      }
    })
    return result;
  }

  sidebarData.dir = loop(JSON.parse(JSON.stringify(sidebarData.fullDir)));
};

function getMatchIndex(title: string) {
  if (!keyword.value) return -1;
  return title.toLowerCase().indexOf(keyword.value.toLowerCase());
}

const findDocWithPath = (path: string): Doc | undefined => {
  const loop = (data: Doc[]): Doc | undefined => {
    let result = undefined

    for (const item of data) {
      if (item.path === path) {
        result = item
        break
      }

      if (item.child) {
        const findResult = loop(item.child)
        if (findResult) {
          result = findResult
          break
        }
      }
    }

    return result
  }

  return loop(sidebarData.rawDir)
}

const createDoc = function (value: string | number | Record<string, any> | undefined, ev: Event) {
  if (value === 'link') {
    linkModalData.visible = true
    return
  }

  emit("onCreate", ev, { parentSlug: 'root', editor: value as string })
}

const onCreate = function (node: TreeNodeData, value: string | number | Record<string, any> | undefined, ev: Event) {
  if (node.key && typeof node.key === 'string' && node.key.indexOf('/') !== -1) {
    const doc = findDocWithPath(node.key as string) as Doc
    console.log('onCreate', node, doc)
    emit("onCreate", ev, {
      parentSlug: doc.slug,
      editor: value
    })
  } else {
    emit("onCreate", ev, {
      editor: value
    })
  }
}

const onSetting = async function (node: TreeNodeData, value: string | number | Record<string, any> | undefined, ev: Event) {
  const doc = findDocWithPath(node.key as string) as Doc
  const options = {
    slug: doc.slug,
    doc: doc,
    action: value
  } as { slug: string, doc: Doc, action: string | number | Record<string, any> | undefined }
  const docLink = `${location.protocol}//${location.host}${doc.path}`
  if (options.action === 'rename') {
    sidebarData.renameDocSlug = node.key as string
    sidebarData.docTitle = doc.title

    nextTick(() => {
      renameInputRef.value?.focus()
    })
  } else if (options.action === 'edit') {
    router.push(doc.path)
    configStore.docEditMode = true
  } else if (options.action === 'copy') {
    emit("onCopy", ev, {
      slug: doc.slug
    })
  } else if (options.action === 'delete') {
    Modal.warning({
      title: `确认框`,
      simple: true,
      content: `确认删除 ${doc.title} 吗？`,
      hideCancel: false,
      onOk: async () => {
        emit("onRemove", ev, options.slug);
      }
    })
  } else if (options.action === 'copyLink') {
    clipboard.copy(docLink)
    Message.success('链接复制成功')
  } else if (options.action === 'openLink') {
    window.open(docLink)
  }
}

const onRenamed = async function (ev: Event, node: TreeNodeData) {
  if (sidebarData.docTitle && sidebarData.docTitle.length > 0) {
    const doc = findDocWithPath(node.key as string) as Doc

    console.log('onRenamed', {
      slug: doc.slug,
      title: sidebarData.docTitle,
      doc: doc
    })

    emit("onChangeTitle", ev, {
      slug: doc.slug,
      title: sidebarData.docTitle,
      doc: doc
    });
  }

  sidebarData.renameDocSlug = ''
  sidebarData.docTitle = ''
}

const checkIsAllowDrop = (options: { dropNode: TreeNodeData; dropPosition: -1 | 0 | 1; }): boolean => {
  const { dropNode, dropPosition } = options

  if (dropNode.key === `/${space.value}/home`) {
    return false
  }

  return true
}

const jump2Doc = (path: string | number | undefined, docEditMode: boolean) => {
  if (typeof path === 'string' && path) {
    configStore.docEditMode = docEditMode
    router.push(path)
  }
}

const eventStopPropagation = (ev: Event) => {
  ev.stopPropagation()
  ev.preventDefault()
  ev.stopImmediatePropagation()
}

watch(() => dir.value.child, async () => {
  updateDirData(dir.value)
}, { immediate: true })

watch(() => route.path, async () => {
  sidebarData.selectedKeys = [route.path]
}, { immediate: true })
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
  background-color: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
}

.docs-sidebar__create svg {
  color: var(--color-text-2);
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

.docs-sidebar__content::-webkit-scrollbar {
  width: 5px;
}

.docs-sidebar__content::-webkit-scrollbar-thumb {
  background-color: var(--color-text-4);
}
</style>

<style>
.docs-sidebar__tree .arco-tree-node {
  margin-top: 1px;
  padding: 0 8px;
}

.docs-sidebar__tree .arco-tree-node.arco-tree-node-selected,
.docs-sidebar__tree .arco-tree-node.arco-tree-node-selected span.arco-tree-node-title,
.docs-sidebar__tree .arco-tree-node:hover {
  color: var(--color-text-1);
  background-color: var(--color-fill-2);
}

.docs-sidebar__tree .arco-tree-node span.arco-tree-node-title.arco-tree-node-title-block,
.docs-sidebar__tree .arco-tree-node span.arco-tree-node-title.arco-tree-node-title-block span.arco-tree-node-title-text {
  width: 100%;
  overflow: hidden;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  padding: 0;
}

.docs-sidebar__tree .arco-tree-node.arco-tree-node-selected span.arco-tree-node-title-text,
.docs-sidebar__tree .arco-tree-node.arco-tree-node-selected span.arco-tree-node-icon {
  color: var(--color-text-1);
  font-weight: 700;
}

.docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;

  padding: 5px 0;
  padding-right: 4px;
  padding-left: 4px;
}

.docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node.docs-sidebar__tree-node-editor-mode {
  padding: 0
}

.docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node .docs-sidebar__tree-node-title {
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}

.docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node .docs-sidebar__tree-node-tools {
  flex: 0 0 30px;
  margin-top: 5px;
}
</style>