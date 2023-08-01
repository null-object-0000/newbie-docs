<template>
  <NewbieHeader></NewbieHeader>

  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Suspense>
        <component :is="Component"></component>
      </Suspense>
    </template>
  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import NewbieHeader from "@/components/NewbieHeader.vue";

</script>
