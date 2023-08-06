import { defineStore } from "pinia";
import { reactive, ref } from "vue";

const mockUser = {
    id: '10999999',
    name: '张三',
    avatar: 'https://avatars.githubusercontent.com/u/20601604?v=4',
    department: '基础研发部'
}

export const useUserStore = defineStore('user', () => {

    const user = reactive(mockUser)
    const isLogin = ref(user && user.id ? true : false);

    return { ...user, isLogin }
});