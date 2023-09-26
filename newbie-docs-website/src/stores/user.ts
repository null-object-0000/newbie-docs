import { ApiStorageEnum, User } from "@/types/global";
import axios from "axios";
import { defineStore } from "pinia";

export const useUsersStore = defineStore('users', {
    state: () => ({
        loginUser: {
            isLogin: false,

            id: 0,
            username: '',
            avatarUrl: '',
            department: '',

            isAdminer: false,
        } as User
    }),

    actions: {
        async refreshCurrentLoginUser() {
            const configStorage = import.meta.env.VITE_API_STORAGE as ApiStorageEnum

            let user;
            if (configStorage === 'restful') {
                const { data: response } = await axios({
                    method: 'get',
                    baseURL: import.meta.env.VITE_REST_API_BASE_URL,
                    url: '/user/current',
                });

                user = { ...response.result, isLogin: response.result?.id > 0 } as User
            } else {
                const mockUser = {
                    id: 10999999,
                    username: '张三',
                    avatarUrl: 'https://avatars.githubusercontent.com/u/20601604?v=4',
                    department: '基础研发部',
                    isAdminer: true,
                } as User

                // const mockUser = {
                //     id: '10888888',
                //     username: '李四',
                //     avatar: 'https://avatars.githubusercontent.com/u/20601604?v=4',
                //     department: '基础研发部',
                //     isAdminer: false,
                // } as User

                user = mockUser
            }

            const isLogin = user && user.id ? true : false;

            this.loginUser = { ...user, isLogin } as User
        }
    },
})