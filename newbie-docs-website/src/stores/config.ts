import { defineStore } from "pinia";
import { reactive, ref } from "vue";

export const useConfigStore = defineStore('config', () => {
    const docEditMode = ref(false);
    const header = reactive({
        path: '/',
        title: 'Newbie Docs',
    });

    const setHeader = (path: string, title: string) => {
        header.path = path;
        header.title = title;
    }


    return {
        header,
        docEditMode,
        setHeader,
    }
});