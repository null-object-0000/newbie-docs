<template>
  <div data-module="sidebar" class="docs-sidebar docs-sidebar--animated"
    :class="sidebar.collapsed ? 'docs-sidebar--collapsed' : ''">
    <aside class="docs-sidebar__content">
      <span class="docs-sidebar__search-wrapper" :data-shortcut="shortcutText">
        <input v-model="keyword" @input="search" class="docs-sidebar__search" type="text" placeholder="搜索" />
        <div class="docs-sidebar__create">
          <svg width="1em" height="1em" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"
            class="larkui-icon larkui-icon-add icon-svg ReaderLayout-module_actionItem_CbOzz index-module_size_wVASz"
            data-name="Add" style="width: 16px; min-width: 16px; height: 16px;">
            <path
              d="M128 28c5.523 0 10 4.477 10 10v80h80c5.523 0 10 4.477 10 10s-4.477 10-10 10h-80v80c0 5.523-4.477 10-10 10s-10-4.477-10-10v-80H38c-5.523 0-10-4.477-10-10s4.477-10 10-10h80V38c0-5.523 4.477-10 10-10Z"
              fill="currentColor" fill-rule="evenodd"></path>
          </svg>
        </div>
      </span>
      <template v-for="(rootItem) of docs.child" :key="rootItem.path">
        <section class="docs-sidebar__section"
          v-if="keywordIncludes(rootItem.title) || keywordIncludes(rootItem?.child?.map(i => i.title))"
          :class="rootItem.expand ? '' : 'docs-sidebar__section--animated docs-sidebar__section--collapsed'">
          <router-link class="docs-sidebar__section-title-wrapper" :to="rootItem.path">
            <div class="docs-sidebar__section-title"
              :class="rootItemIsActive(rootItem) ? 'docs-sidebar__section-title--active' : ''">
              <span>
                {{ rootItem.title }}
              </span>
              <button v-if="rootItem.child && keywordIncludes(rootItem.child.map(i => i.title))"
                class="docs-sidebar__section-toggler" @click="(event) => extend(event, rootItem)">
                <docs-icon-arrow-up v-if="rootItem.expand" />
                <docs-icon-arrow-down v-else />
              </button>
            </div>
          </router-link>
          <ul v-if="rootItem.child && rootItem.expand && keywordIncludes(rootItem.child.map(i => i.title))"
            class="docs-sidebar__section-list" :style="{ 'max-height': `${31 * rootItem.child.length}px` }">
            <template v-for="(item) of rootItem.child" :key="item.path">
              <li v-if="keywordIncludes(item.title)">
                <router-link class="docs-sidebar__section-list-item-wrapper" :to="item.path">
                  <div class="docs-sidebar__section-list-item"
                    :class="item.path === activePath ? 'docs-sidebar__section-list-item--active' : ''">
                    <span>{{ item.title }}</span>
                  </div>
                </router-link>
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
</template>

<script setup lang="ts">
import { reactive, ref, watch, type PropType, toRefs } from "vue";
import type { Doc } from "@/types/global";
import { useMagicKeys, whenever } from '@vueuse/core'

const { ctrl_j } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 'j' && e.type === 'keydown') {
      e.preventDefault()
    }
  },
})

whenever(ctrl_j, () => {
  // 激活 class 等于 docs-sidebar__search 的输入框
  (document.querySelector('.docs-sidebar__search') as HTMLElement)?.focus()
})

const props = defineProps({
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

const { docs, activePath } = toRefs(props);

const sidebar = reactive({
  collapsed: false,
});

const extend = function (event: Event, rootItem: Doc) {
  rootItem.expand = !rootItem.expand;
  event.preventDefault();
  event.stopPropagation();
};

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
  if (keyword.value.length <= 0) {
    return true
  }

  if (str === undefined) {
    return false
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
</script>

<style scoped>
.docs-sidebar__search-wrapper:after {
  margin-left: -105px;
  margin-top: 10px;
}

.docs-sidebar__section-list-item--active,
.docs-sidebar__section-title--active {
  background: #EFF0F0;
  color: #262626;
  font-weight: 700;
  border-radius: 6px;
  border: 1.5px solid #EFF0F0;
}

.docs-sidebar__search-wrapper {
  display: flex;
}

.docs-sidebar__search {
  display: flex;
  width: calc(100% - 32px);
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
</style>
