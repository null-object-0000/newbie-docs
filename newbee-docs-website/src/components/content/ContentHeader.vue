<template>
  <header class="docs-header">
    <a :href="docs.path" class="docs-header__logo">
      <docs-icon-book-type-default style="margin-right: 10px" /><span class="arco-page-header-title">{{ docs.title
      }}</span>
    </a>
    <ul class="docs-header__menu">
      <li v-if="userStore.isLogin" class="docs-header__menu-add docs-header__menu-add--desktop">
        <a class="docs-button docs-button--primary docs-button--small docs-button--with-icon docs-button--with-label"
          href="/page/new">
          <div class="docs-button__icon">
            <docs-icon-plus />
          </div>
          新建
        </a>
      </li>
      <li class="docs-header__menu-add docs-header__menu-add--mobile">
        <a class="docs-button docs-button--primary docs-button--small docs-button--with-icon" href="/page/new">
          <div class="docs-button__icon">
            <docs-icon-plus />
          </div>
        </a>
      </li>
    </ul>
  </header>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { Doc } from "@/types/global";
import { useUserStore } from "@/stores/user";
defineProps({
  docs: {
    type: Object as PropType<Doc>,
    required: true,
  },
});

const userStore = useUserStore();
</script>

<style scoped></style>
