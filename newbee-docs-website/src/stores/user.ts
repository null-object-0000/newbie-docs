import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore('user', () => {
    const isLogin = ref(true);

    return { isLogin }
});