<template>
  <header class="docs-header" v-if="header">
    <a :href="header.path" class="docs-header__logo">
      <docs-icon-book-type-default style="margin-right: 10px" />
      <span class="arco-page-header-title">{{ header.title }}</span>
    </a>
  </header>
</template>

<script setup lang="ts">
import DocsIconBookTypeDefault from "@/components/icons/IconBookTypeDefault.vue";
import { toRefs } from "vue";
import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

const { header } = toRefs(configStore);
</script>

<style scoped>
.docs-header {
  background: #fff;
  border-bottom: 1px solid #e8e8eb;
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  font-size: 18px;
  justify-content: space-between;
  padding: 12px 22px;
  position: sticky;
  top: 0;
  z-index: 10;
}

@media (min-width: 981px) {
  .docs-header {
    height: 56px;
  }
}

.docs-header__logo,
.docs-header__menu-link {
  align-self: center;
  display: inline-block;
  line-height: 24px;
  text-decoration: none;
}

.docs-header__logo {
  color: inherit;
  font-weight: 700;
  padding: 4px 0;
}
</style>
