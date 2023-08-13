<template>
  <NewbieHeader></NewbieHeader>

  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <div style="padding-top: var(--layout-height-header);">
        <Suspense>
          <component :is="Component"></component>
        </Suspense>
      </div>
    </template>
  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import NewbieHeader from "@/components/NewbieHeader.vue";
import { onBeforeMount } from "vue";
import { useUsersStore } from "./stores/user";

const usersStore = useUsersStore();

onBeforeMount(async () => {
  await usersStore.refreshCurrentLoginUser();
})
</script>

<style>
#app {
  height: 100vh;
  background-color: var(--color-fill-2);
}
</style>
