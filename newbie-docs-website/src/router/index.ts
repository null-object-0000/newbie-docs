import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/:bookSlug/:docSlug?",
      name: "content",
      component: () => import("@/views/ContentView.vue"),
    },
  ],
});

export default router;
