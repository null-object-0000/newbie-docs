<template>
  <div data-module="sidebar" class="docs-sidebar docs-sidebar--animated"
    :class="sidebar.collapsed ? 'docs-sidebar--collapsed' : ''" ref="sidebarRef">
    <aside class="docs-sidebar__content">
      <span class="docs-sidebar__search-wrapper" :data-shortcut="shortcutText">
        <a-input ref="searchInputRef" v-model="keyword" @input="search" class="docs-sidebar__search" type="text"
          placeholder="搜索" />
        <a-dropdown trigger="hover" position="bl" @select="createDoc">
          <a-button class="docs-sidebar__create" type="outline" :disabled="!isEditorAuth(book?.loginUserAuthType)">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
          <template #content>
            <a-doption :value="1"><template #icon><icon-file /></template>Word</a-doption>
            <a-doption :value="2"><template #icon><icon-code-block /></template>Block</a-doption>
            <a-doption :value="3"><template #icon><icon-code /></template>Markdown</a-doption>
            <a-doption disabled :value="4"><template #icon><icon-link /></template>Link</a-doption>
          </template>
        </a-dropdown>
      </span>

      <a-spin v-if="loading.get()" style="margin-top: calc(40vh + 28px - 64px); justify-content: center; display: flex;"
        dot></a-spin>
      <a-tree v-else ref="sidebarTreeRef" draggable block-node default-expand-all default-expand-selected
        class="docs-sidebar__tree" v-if="sidebarData.dir" :data="sidebarData.dir"
        v-model:selected-keys="sidebarData.selectedKeys" :allow-drop="checkIsAllowDrop"
        @select="(selectedKeys, { node }) => jump2Doc(node?.key, false)" @drop="drop">
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

            <template
              v-if="node.key !== `/${space}/home` && sidebarData.renameDocSlug !== node.key && isAnyNodeLoading !== true">
              <a-dropdown trigger="click" @select="(value, ev) => onSetting(node, value, ev)" :popup-max-height="false"
                @popup-visible-change="visible => visible ? null : sidebarData.hoverNode = null">
                <icon-more-vertical class="docs-sidebar__tree-node-tools" @click="eventStopPropagation"
                  :style="{ visibility: sidebarData.hoverNode === node.key ? 'visible' : 'hidden' }" />
                <template #content>
                  <a-doption value="rename" v-if="isEditorAuth(findDocWithField(node.key)?.loginUserAuthType)">
                    <template #icon><icon-loop /></template>重命名</a-doption>
                  <a-doption value="edit" v-if="isEditorAuth(findDocWithField(node.key)?.loginUserAuthType)">
                    <template #icon><icon-edit /></template>编辑文档</a-doption>
                  <a-doption value="permission" v-if="isAdminerAuth(findDocWithField(node.key)?.loginUserAuthType)">
                    <template #icon><icon-lock /></template>权限管理</a-doption>
                  <a-doption value="copyLink">
                    <template #icon><icon-link /></template>复制链接</a-doption>
                  <a-doption value="openLink">
                    <template #icon><icon-launch /></template>在新标签页打开</a-doption>
                  <a-doption value="copy" v-if="isEditorAuth(book?.loginUserAuthType)">
                    <template #icon><icon-copy /></template>复制</a-doption>
                  <a-doption value="delete" v-if="isAdminerAuth(findDocWithField(node.key)?.loginUserAuthType)"
                    :style="{ color: 'rgb(var(--danger-6))' }">
                    <template #icon><icon-delete /></template>删除
                  </a-doption>
                </template>
              </a-dropdown>
              <a-dropdown v-if="isEditorAuth(book?.loginUserAuthType)" trigger="click"
                @select="(value, ev) => onCreate(node, value, ev)"
                @popup-visible-change="visible => visible ? null : sidebarData.hoverNode = null">
                <icon-plus class="docs-sidebar__tree-node-tools" @click="eventStopPropagation"
                  :style="{ visibility: sidebarData.hoverNode === node.key ? 'visible' : 'hidden' }" />
                <template #content>
                  <a-doption :value="1"><template #icon><icon-file /></template>Word</a-doption>
                  <a-doption :value="2"><template #icon><icon-code-block /></template>Block</a-doption>
                  <a-doption :value="3"><template #icon><icon-code /></template>Markdown</a-doption>
                  <a-doption disabled :value="4"><template #icon><icon-link /></template>Link</a-doption>
                </template>
              </a-dropdown>
            </template>

            <icon-loading v-if="nodesLoading[node.key].get()" class="docs-sidebar__tree-node-tools" />
          </span>
        </template>
        <template #switcher-icon="node, { isLeaf }">
          <IconDown v-if="!isLeaf" />
          <IconStar v-if="isLeaf" />
        </template>
        <template #extra="node">
          <icon-home style="position: absolute;" v-if="node.key === `/${space}/home`" />
        </template>
      </a-tree>
    </aside>

    <!-- 收起展开文档索引导航栏 -->
    <!-- <div class="docs-sidebar__slider" @click="sidebar.collapsed = !sidebar.collapsed">
      <docs-icon-arrow-left />
    </div> -->
  </div>

  <PermissionModal v-if="permissionModal.visible" :data-type="2" v-model:visible="permissionModal.visible"
    :doc="sidebarData.settingDoc" width="750px">
  </PermissionModal>
</template>

<script setup lang="ts">
import { reactive, ref, toRefs, watch, nextTick, type PropType } from "vue";
import type { Doc } from "@/types/global";
import { useMagicKeys, whenever, useClipboard } from '@vueuse/core'
import { Message, Modal, TreeInstance, type TreeNodeData } from "@arco-design/web-vue";
import { useConfigsStore } from "@/stores/config";
import { useUsersStore } from "@/stores/user";
import { useDocsStore } from "@/stores/doc";
import { useDocsEventBus } from "@/events/docs";
import { useRoute, useRouter } from "vue-router";
import PermissionModal from "@/components/modals/PermissionModal.vue";
import { useLoading } from '@/hooks';
import { computed } from "vue";
import { AxiosError } from "axios";

const route = useRoute();
const router = useRouter();

const configsStore = useConfigsStore();
const usersStore = useUsersStore();
const docsStore = useDocsStore();
const docsEventBus = useDocsEventBus();

const loading = useLoading()
loading.set(true)

const { book } = toRefs(docsStore);

const nodesLoading = ref({} as Record<string, {
  get: (real?: boolean) => boolean,
  set: (value: boolean) => Promise<void>
}>)

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
});

const emit = defineEmits(["onCreate", 'onCopy', "onChangeTitle"]);

const { space } = toRefs(props);

const sidebarTreeRef = ref<TreeInstance | null>(null)
const renameInputRef = ref<HTMLElement | null>(null)
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

const permissionModal = reactive({
  visible: false,
})

const isAnyNodeLoading = computed(() => {
  return sidebarData.dir.some(node => nodesLoading.value[node.key as string].get())
})

const formatDirData = (dir: Doc[]): TreeNodeData[] => {
  return dir.map(item => {
    const node = {} as TreeNodeData

    if (item.children && item.children.length > 0) {
      node.children = formatDirData(item.children)
    }

    node.key = `/${space.value}/${item.slug}`
    node.title = item.title
    if (node.key === `/${space.value}/home`) {
      node.draggable = false
    } else {
      node.draggable = isEditorAuth(item.loginUserAuthType)
    }

    nodesLoading.value[node.key] = useLoading()

    return node
  })
}

const updateDirData = (dir?: Doc) => {
  sidebarData.rawDir = dir?.children || []
  sidebarData.fullDir = formatDirData(JSON.parse(JSON.stringify(dir?.children || [])))

  search()

  if (sidebarData.dir.length > 0) {
    loading.set(false)
  }
}

const sidebar = reactive({
  collapsed: false,
});

let shortcutText = ref('Ctrl + J');

// Search initialize with platform specific shortcut.
if (window.navigator.userAgent.indexOf('Mac') !== -1) {
  shortcutText.value = '⌘ + J';
}

const keyword = ref('');
const search = () => {
  // 基于 keyword 过滤展示的 docs
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
  nextTick(() => {
    sidebarTreeRef.value?.expandAll()
  })
};

function getMatchIndex(title: string) {
  if (!keyword.value) return -1;
  return title.toLowerCase().indexOf(keyword.value.toLowerCase());
}

const findDocWithField = (value: any, field: keyof Doc = 'path'): Doc | undefined => {
  const loop = (data: Doc[]): Doc | undefined => {
    let result = undefined

    for (const item of data) {
      if (item[field] === value) {
        result = item
        break
      }

      if (item.children) {
        const findResult = loop(item.children)
        if (findResult) {
          result = findResult
          break
        }
      }
    }

    return result
  }

  let doc = loop(sidebarData.rawDir)
  doc = doc ? JSON.parse(JSON.stringify(doc)) : undefined
  delete doc?.children
  return doc
}

const preInsertDoc = function (parentKey: string, doc: TreeNodeData) {
  const loop = (dir: TreeNodeData[], parentKey: string, createDoc: TreeNodeData) => {
    for (const item of dir) {
      if (item.key === parentKey) {
        item.children?.push(createDoc)
        break
      }

      if (item.children) {
        loop(item.children, parentKey, createDoc)
      }
    }
  }

  const nodeKey = Math.random() * 100000000 + '' as string
  nodesLoading.value[nodeKey] = useLoading()
  nodesLoading.value[nodeKey].set(true)

  doc.key = nodeKey
  doc.draggable = false

  if (parentKey === `/${space.value}`) {
    sidebarData.dir.push(doc)
  } else {
    loop(sidebarData.dir, parentKey, doc)
  }

  nextTick(() => {
    sidebarTreeRef.value?.expandAll()
  })
}

const createDoc = function (value: string | number | Record<string, any> | undefined, ev: Event) {
  onCreate({}, value, ev)
}

const onCreate = function (node: TreeNodeData, value: string | number | Record<string, any> | undefined, ev: Event) {
  if (node.key && typeof node.key === 'string' && node.key.indexOf('/') !== -1) {
    const doc = findDocWithField(node.key as string) as Doc

    preInsertDoc(node.key, {
      title: '新建文档中......'
    })

    emit("onCreate", ev, {
      parentId: doc.id,
      editor: value
    })
  } else {
    // 预插入到根目录
    preInsertDoc(`/${space.value}`, {
      title: '新建文档中......'
    })

    emit("onCreate", ev, {
      editor: value
    })
  }
}

const onCopy = (doc: Doc, ev: Event) => {
  const parentDoc = findDocWithField(doc.parentId, 'id') as Doc

  preInsertDoc(parentDoc?.path || `/${space.value}`, {
    title: '复制文档中......'
  })

  emit("onCopy", ev, {
    id: doc.id
  })
}

const docsService = {
  removeDoc: async (nodeKey: string, doc: Doc) => {
    nodesLoading.value[nodeKey as string].set(true)
    try {
      const result = await docsStore.docsApi.remove(space.value, doc.id)
      if (result) {
        if (docsStore.doc?.id === doc.id) {
          configsStore.docEditMode = false
          router.push(`/${space.value}/home`)
        }
      }

      return result
    } catch (error) {
      if (error instanceof AxiosError) {
        Message.error(error.message)
      }

      console.error(error)
    } finally {
      nodesLoading.value[nodeKey as string].set(false)
    }
  }
}

const onSetting = async function (node: TreeNodeData, value: string | number | Record<string, any> | undefined, ev: Event) {
  if (isAnyNodeLoading.value) {
    console.warn('有节点在 loading 暂不可设置')
    return
  }

  const doc = findDocWithField(node.key as string) as Doc
  const options = {
    action: value
  } as { action: string | number | Record<string, any> | undefined }
  const docLink = `${location.protocol}//${location.host}${doc.path}`
  if (options.action === 'rename') {
    sidebarData.renameDocSlug = node.key as string
    sidebarData.docTitle = doc.title

    nextTick(() => {
      renameInputRef.value?.focus()
    })
  } else if (options.action === 'edit') {
    router.push(doc.path)
    configsStore.docEditMode = true
  } else if (options.action === 'copy') {
    onCopy(doc, ev)
  } else if (options.action === 'delete') {
    Modal.warning({
      title: `确认框`,
      simple: true,
      content: `确认删除 “${doc.title}” 文档吗？`,
      hideCancel: false,
      onOk: async () => {
        await docsService.removeDoc(node.key as string, doc)
      }
    })
  } else if (options.action === 'copyLink') {
    clipboard.copy(docLink)
    Message.success('链接复制成功')
  } else if (options.action === 'openLink') {
    window.open(docLink)
  } else if (options.action === 'permission') {
    sidebarData.settingDoc = doc
    permissionModal.visible = true
  }
}

const onRenamed = async function (ev: Event, node: TreeNodeData) {
  if (sidebarData.docTitle && sidebarData.docTitle.length > 0) {
    const doc = findDocWithField(node.key as string) as Doc
    doc.title = sidebarData.docTitle

    emit("onChangeTitle", ev, {
      id: doc.id,
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

const drop = async (data: { e: DragEvent; dragNode: TreeNodeData; dropNode: TreeNodeData; dropPosition: number; }) => {
  if (isAnyNodeLoading.value) {
    console.warn('有节点在 loading 暂不可拖拽')
    return
  }

  // 拖拽节点
  const dragDoc = findDocWithField(data.dragNode.key as string) as Doc
  // 目标节点
  const dropDoc = findDocWithField(data.dropNode.key as string) as Doc

  nodesLoading.value[data.dragNode.key as string].set(true)
  nodesLoading.value[data.dropNode.key as string].set(true)
  try {
    await docsStore.docsApi.move(space.value, data.dropPosition, dragDoc.id, dropDoc.id)
  } catch (error) {
    if (error instanceof AxiosError) {
      Message.error(error.message)
    }

    console.error(error)
  } finally {
    nodesLoading.value[data.dragNode.key as string].set(false)
    nodesLoading.value[data.dropNode.key as string].set(false)
  }
}

const jump2Doc = (path: string | number | undefined, docEditMode: boolean) => {
  if (typeof path === 'string' && path) {
    configsStore.docEditMode = docEditMode
    router.push(path)
  }
}

const eventStopPropagation = (ev: Event) => {
  ev.stopPropagation()
  ev.preventDefault()
  ev.stopImmediatePropagation()
}

const isViewerAuth = (authType?: number | null) => {
  return authType === 3 || usersStore.loginUser.isAdminer
}

const isEditorAuth = (authType?: number | null) => {
  return authType === 1 || authType === 2 || usersStore.loginUser.isAdminer
}

const isAdminerAuth = (authType?: number | null) => {
  return authType === 1 || usersStore.loginUser.isAdminer
}

watch(() => docsStore.dir.children, async () => {
  updateDirData()

  updateDirData(docsStore.dir)
}, { immediate: true })

watch(() => route.path, async () => {
  sidebarData.selectedKeys = [route.path]
}, { immediate: true })

docsEventBus.onDirChange(space.value, (event: Event, value: { space: string, dir: Doc }) => {
  // 先更新成空数据，再更新真实数据，强制触发 tree 的更新
  updateDirData()

  updateDirData(value.dir)
})
</script>

<style>
.docs-sidebar .docs-sidebar__content {
  padding: 16px 8px;
}

.docs-sidebar .docs-sidebar__search-wrapper:after {
  margin-left: -105px;
  margin-top: 10px;
}

.docs-sidebar .docs-sidebar__search-wrapper {
  display: flex;
  margin-bottom: 15px;
}

.docs-sidebar .docs-sidebar__search {
  display: flex;
  width: calc(100% - 32px - 12px);
  height: 34px;
}

.docs-sidebar .docs-sidebar__create {
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

.docs-sidebar .docs-sidebar__create svg {
  color: var(--color-text-2);
  width: 16px;
  min-width: 16px;
  height: 16px;
}

.docs-sidebar .docs-sidebar-link {
  cursor: pointer;
}

.docs-sidebar .docs-sidebar__section {
  margin-top: 5px;
}

.docs-sidebar .docs-sidebar__content::-webkit-scrollbar {
  width: 5px;
}

.docs-sidebar .docs-sidebar__content::-webkit-scrollbar-thumb {
  background-color: var(--color-text-4);
}


.docs-sidebar .docs-sidebar__tree .arco-tree-node {
  margin-top: 1px;
  padding: 0 8px;
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node.arco-tree-node-selected,
.docs-sidebar .docs-sidebar__tree .arco-tree-node.arco-tree-node-selected span.arco-tree-node-title,
.docs-sidebar .docs-sidebar__tree .arco-tree-node:hover {
  color: var(--color-text-1);
  background-color: var(--color-fill-2);
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node span.arco-tree-node-title.arco-tree-node-title-block,
.docs-sidebar .docs-sidebar__tree .arco-tree-node span.arco-tree-node-title.arco-tree-node-title-block span.arco-tree-node-title-text {
  width: 100%;
  max-width: calc(var(--layout-sidebar-width) - 50px);
  padding: 0;
  /* FIXME: 开启后 tree 的拖拽辅助线就没了，会有有空再看 */
  /* overflow-x: hidden; */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node.arco-tree-node-selected span.arco-tree-node-title-text,
.docs-sidebar .docs-sidebar__tree .arco-tree-node.arco-tree-node-selected span.arco-tree-node-icon {
  color: var(--color-text-1);
  font-weight: 700;
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;

  padding: 5px 0;
  padding-right: 4px;
  padding-left: 4px;
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node.docs-sidebar__tree-node-editor-mode {
  padding: 0
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node .docs-sidebar__tree-node-title {
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}

.docs-sidebar .docs-sidebar__tree .arco-tree-node .docs-sidebar__tree-node .docs-sidebar__tree-node-tools {
  flex: 0 0 30px;
  margin-top: 5px;
}

.docs-sidebar .arco-tree-node-drag-icon {
  display: none;
  flex: 0 0 0;
}
</style>