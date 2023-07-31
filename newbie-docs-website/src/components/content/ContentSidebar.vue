<template>
  <div data-module="sidebar" class="docs-sidebar docs-sidebar--animated"
    :class="sidebar.collapsed ? 'docs-sidebar--collapsed' : ''">
    <aside class="docs-sidebar__content">

      <span class="docs-sidebar__search-wrapper" :data-shortcut="shortcutText">
        <a-input ref="searchInputRef" v-model="keyword" @input="search" class="docs-sidebar__search" type="text" placeholder="搜索" />

        <a-dropdown trigger="hover" position="bl" @select="createDoc">
          <a-button class="docs-sidebar__create" type="outline">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
          <template #content>
            <a-doption value="block"><template #icon><icon-code-block /></template>Block</a-doption>
            <a-doption value="word"><template #icon><icon-file /></template>Word</a-doption>
            <a-doption value="link"><template #icon><icon-link /></template>Link</a-doption>
          </template>
        </a-dropdown>
      </span>
      <template v-for="(rootItem) of docs.child">
        <section class="docs-sidebar__section" :key="rootItem.path"
          v-if="keywordIncludes(rootItem.title) || keywordIncludes(rootItem?.child?.map(i => i.title))"
          :class="rootItem.expand ? '' : 'docs-sidebar__section--animated docs-sidebar__section--collapsed'">
          <div class="docs-sidebar__section-title-wrapper docs-sidebar-link" @click="jump2(rootItem.path)">
            <div class="docs-sidebar__section-title"
              :class="rootItemIsActive(rootItem) ? 'docs-sidebar__section-title--active' : ''">
              <span>
                {{ rootItem.title }}
              </span>
              <button
                v-if="rootItem.child && rootItem.child.length > 0 && keywordIncludes(rootItem.child.map(i => i.title))"
                class="docs-sidebar__section-toggler" @click="(event) => extend(event, rootItem)">
                <docs-icon-arrow-up v-if="rootItem.expand" />
                <docs-icon-arrow-down v-else />
              </button>
            </div>
          </div>
          <ul
            v-if="rootItem.child && rootItem.child.length > 0 && rootItem.expand && keywordIncludes(rootItem.child.map(i => i.title))"
            class="docs-sidebar__section-list" :style="{ 'max-height': `${31 * rootItem.child.length}px` }">
            <template v-for="(item) of rootItem.child" :key="item.path">
              <li v-if="keywordIncludes(item.title)">
                <div class="docs-sidebar__section-list-item-wrapper docs-sidebar-link" @click="jump2(item.path)">
                  <div class="docs-sidebar__section-list-item"
                    :class="item.path === activePath ? 'docs-sidebar__section-list-item--active' : ''">
                    <span>{{ item.title }}</span>
                  </div>
                </div>
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
import { reactive, ref, watch, type PropType, toRefs } from "vue";
import type { Doc } from "@/types/global";
import { useMagicKeys, whenever } from '@vueuse/core'
import router from "@/router";
import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

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

const sidebar = reactive({
  collapsed: false,
});

const extend = function (event: Event, rootItem: Doc) {
  rootItem.expand = !rootItem.expand;
  event.preventDefault();
  event.stopPropagation();
};

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

  emit("onCreate", ev, { editor: value });
}

const createLinkDoc = function (ev: Event) {
  emit("onCreate", ev, { editor: 'link', content: linkModalData.form.url });
}

const jump2 = (path: string) => {
  configStore.docEditMode = false
  router.push(path)
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
</style>
