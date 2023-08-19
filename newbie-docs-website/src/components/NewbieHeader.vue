<template>
  <div class="docs-header">
    <div class="docs-header__title">
      <a :href="header.path" class="docs-header__logo">
        <docs-icon-book-type-default style="margin-right: 10px" />
        <span class="arco-page-header-title">{{ header.title }}</span>
      </a>
    </div>
    <div class="docs-header__breadcrumb">
      <template v-if="bookSlug && docsStore.spaceData[bookSlug] && docsStore.doc.slug !== 'home'">
        <a-breadcrumb v-if="getParents([docsStore.spaceData[bookSlug].tree], docsStore.doc.parentId)" :max-count="3">
          <template #separator>
            <icon-right />
          </template>

          <a-breadcrumb-item v-for="parent in getParents([docsStore.spaceData[bookSlug].tree], docsStore.doc.parentId)"
            :key="parent.slug">
            <router-link v-if="configsStore.docEditMode === true" :to="''">{{ parent.title }}</router-link>
            <router-link v-else :to="parent.path || ''">{{ parent.title }}</router-link>
          </a-breadcrumb-item>

          <a-breadcrumb-item>{{ docsStore.doc.title }}</a-breadcrumb-item>
        </a-breadcrumb>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import DocsIconBookTypeDefault from "@/components/icons/IconBookTypeDefault.vue";
import { toRefs, watch, ref } from "vue";
import { useConfigsStore } from "@/stores/config";
import { useRoute } from 'vue-router';
import { useDocsStore } from '@/stores/doc';
import { Doc } from "@/types/global";

const configsStore = useConfigsStore();
const docsStore = useDocsStore()

const route = useRoute();

const { header } = toRefs(configsStore);

let bookSlug = ref(route.params.bookSlug as string)

const getParent = (data: Doc[], id?: number): Doc | undefined => {
  if (id === undefined) {
    return;
  }

  for (const item of data) {
    if (item.id === id && item.slug === 'root') {
      item.title = docsStore.book.title
      return item;
    }

    if (item.id === id) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const parent = getParent(item.children, id);
      if (parent) {
        return parent;
      }
    }
  }
};

const getParents = (data: Doc[], id?: number): Doc[] => {
  const parents: Doc[] = [];
  let parent = getParent(data, id);
  while (parent) {
    parents.unshift(parent);
    parent = getParent(data, parent.parentId);
  }
  return parents;
};

// 监听路由变化
watch(() => route.params.bookSlug, async () => {
  bookSlug.value = route.params.bookSlug as string;
}, { immediate: true })
</script>

<style scoped>
.docs-header {
  display: flex;

  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding-top: 12px;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 12px;

  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
  font-size: 18px;

  height: var(--layout-height-header);

  z-index: 2;
}

.docs-header .docs-header__title {
  width: 280px;
  width: var(--layout-sidebar-width);

  color: inherit;
  font-weight: 700;
  padding: 4px 0;

  align-self: center;
  display: inline-block;
  line-height: 24px;
  text-decoration: none;

  margin-left: 22px;
}

@media (max-width: 1000px) {
  .docs-header .docs-header__title {
    width: 100%;
  }
}

.docs-header .docs-header__breadcrumb {
  margin-left: max(0px, calc(50vw - 630px) - 22px);
  margin-left: max(var(--main-col-min-margin-left), calc(50vw - var(--layout-sidebar-width) - var(--layout-width-main-col) / 2) - var(--layout-padding-horizontal));
  margin-right: auto;
  max-width: min(calc(980px + var(--max-space-between-cols)), calc(100% - 280px));
  max-width: min(calc(var(--layout-width-main-col) + var(--max-space-between-cols) + var(--layout-sidebar-width)), calc(100% - var(--layout-sidebar-width)));
  padding: 0;

  --max-space-between-cols: 160px;
  word-wrap: break-word;
  box-sizing: border-box;
  display: flex;
  flex-grow: 2;
  justify-content: space-between;
  padding: 30px 22px;
  padding: var(--layout-padding-vertical) var(--layout-padding-horizontal);

  padding-top: 12px;
}

@media (max-width: 1000px) {
  .docs-header .docs-header__breadcrumb {
    display: none;
  }
}

.docs-header__logo {
  text-decoration: none;
}
</style>
