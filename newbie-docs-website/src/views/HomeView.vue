<template>
    <div class="home-view">
        <template v-if="loading.get()">
            <a-spin style="margin-top: calc(40vh + 28px); justify-content: center; display: flex;" dot
                tip="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;疯狂加载中"></a-spin>
        </template>
        <template v-else>
            <a-row v-if="dir && dir.length > 0" :gutter="40" justify="center">
                <a-col flex="360px" v-for="book of dir" :style="{ marginBottom: '20px' }">
                    <router-link style="color: unset; text-decoration: unset;" :to="'/' + book.slug + '/home'">
                        <a-card :style="{ width: '360px', height: '280px' }">
                            <template #cover>
                                <div :style="{ height: '204px', overflow: 'hidden', }">
                                    <img :style="{ width: '100%', transform: 'translateY(-20px)' }" alt="dessert"
                                        :src="book.cover ? book.cover : 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a20012a2d4d5b9db43dfc6a01fe508c0.png~tplv-uwbnlip3yd-webp.webp'" />
                                </div>
                            </template>
                            <a-card-meta>
                                <template #title>
                                    {{ book.title }}
                                </template>
                                <template #description>
                                    {{ book.description }}
                                </template>
                            </a-card-meta>
                        </a-card>
                    </router-link>
                </a-col>
            </a-row>

            <template v-else-if="loading.get(true) !== true">
                <a-empty style="margin-top: 40vh;" v-if="loadErroring">
                    <template #image>
                        <icon-exclamation-circle-fill />
                    </template>
                    网络异常，请稍后重试
                </a-empty>
                <a-empty style="margin-top: 40vh;" v-else description="快去新建知识库吧~" />
            </template>
        </template>
    </div>

    <a-button class="add-btn" type="primary" v-if="usersStore.loginUser.isAdminer" @click="editBookModal.visible = true">
        <template #icon>
            <icon-plus />
        </template>
        <template #default>新建</template>
    </a-button>
    <a-button class="login-btn" type="outline"
        v-else-if="usersStore.loginUser.isLogin === false && usersStore.loginUser.loginOauth2Url"
        :href="usersStore.loginUser.loginOauth2Url">
        <template #icon>
            <icon-github />
        </template>
        <template #default>登录</template>
    </a-button>

    <BookSettingsModal v-model:visible="editBookModal.visible" v-model="editBookModal.form" @saved="bookSaved">
    </BookSettingsModal>
</template>

<script setup lang="ts">
import { useConfigsStore } from "@/stores/config";
import { useUsersStore } from '@/stores/user';
import { ref, reactive, onBeforeMount } from 'vue';
import { useBooksApi } from '@/api/books';
import { Book } from '@/types/global'
import { AxiosError } from "axios";
import { useLoading } from '@/hooks';
import BookSettingsModal from "@/components/modals/BookSettingsModal.vue";
import { nextTick } from "vue";

const usersStore = useUsersStore();
const configsStore = useConfigsStore();

const booksApi = useBooksApi('localStorage')

const loading = useLoading()

configsStore.setHeader('/', 'Newbie Docs');

const dir = ref<Book[]>([])
const loadErroring = ref(false)
const editBookModal = reactive({
    visible: false,
    form: {
        id: -1,
        slug: '',
        title: '',
        cover: '',
        description: '',
    } as Book,
})

onBeforeMount(async () => {
    loading.set(true)
    try {
        dir.value = await booksApi.dir() as Book[]
    } catch (error) {
        // 判断是否是 Error
        if (error instanceof AxiosError) {
            loadErroring.value = true
        }

        console.error(error)
    } finally {
        loading.set(false)
    }
})

const bookSaved = async (result: boolean) => {
    if (result) {
        dir.value = await booksApi.dir() as Book[]

        editBookModal.form = {
            id: -1,
            slug: '',
            title: '',
            cover: '',
            description: '',
        } as Book

        await nextTick()
    }
}
</script>

<style scoped>
.home-view {
    box-sizing: border-box;
    width: 100%;
    padding: 40px;
    background-color: var(--color-fill-2);
}

.icon-hover {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: all 0.1s;
}

.icon-hover:hover {
    background-color: rgb(var(--gray-2));
}

.add-btn,
.login-btn {
    position: fixed;
    right: 16px;
    top: 10px;
    z-index: 1000;
}
</style>