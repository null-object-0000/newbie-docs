<template>
  <NewbieHeader></NewbieHeader>

  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import NewbieHeader from "@/components/NewbieHeader.vue";

</script>
