<template>
    <div class="home-view">
        <template v-if="loading.get()">
            <a-spin style="margin-top: 40vh; justify-content: center; display: flex;" dot></a-spin>
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

    <a-button class="add-btn" type="primary" v-if="loginUser.isAdminer" @click="editBookModal.visible = true">
        <template #icon>
            <icon-plus />
        </template>
        <template #default>新建</template>
    </a-button>

    <a-modal v-model:visible="editBookModal.visible" @before-ok="addBook" :modal-style="{ 'max-width': '90%' }">
        <template #title>
            新建知识库
        </template>
        <a-form ref="editBookFormRef" :model="editBookModal.form" auto-label-width>
            <a-form-item field="slug" label="标识" extra="请用小写英文字母、数字、下划线、短横线组合，但只能以英文字母开头"
                :rules="[{ required: true, type: 'string', match: /^[a-z][a-z0-9_-]*$/ }]">
                <a-input v-model="editBookModal.form.slug" placeholder="请输入标识，例如：alle" />
            </a-form-item>
            <a-form-item field="title" label="名称" :rules="[{ required: true, type: 'string' }]">
                <a-input v-model="editBookModal.form.title" placeholder="请输入名称，例如：万象开放平台" />
            </a-form-item>
            <a-form-item field="description" label="描述">
                <a-input v-model="editBookModal.form.description" placeholder="请输入描述，例如：一个专业的低代码营销活动模板系统" />
            </a-form-item>
            <a-form-item field="cover" label="封面">
                <a-input v-model="editBookModal.form.cover" placeholder="请输入封面图地址" />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup lang="ts">
import { useConfigsStore } from "@/stores/config";
import { useUsersStore } from '@/stores/user';
import { ref, reactive } from 'vue';
import { useBooksApi } from '@/api/books';
import { Book } from '@/types/global'
import { FormInstance } from '@arco-design/web-vue/es/form';
import { onBeforeMount } from "vue";
import { Message } from "@arco-design/web-vue";
import { AxiosError } from "axios";
import { useLoading } from '@/hooks';

const { loginUser } = useUsersStore();
const configsStore = useConfigsStore();

const booksApi = useBooksApi('localStorage')

const loading = useLoading()

configsStore.setHeader('/', 'Newbie Docs');

const dir = ref<Book[]>([])
const editBookFormRef = ref<FormInstance>();
const loadErroring = ref(false)
const editBookModal = reactive({
    visible: false,
    form: {
        slug: '',
        title: '',
        cover: '',
        description: '',
    },
})

onBeforeMount(async () => {
    await loading.set(true)
    try {
        dir.value = await booksApi.dir() as Book[]
    } catch (error) {
        // 判断是否是 Error
        if (error instanceof AxiosError) {
            loadErroring.value = true
        }
    } finally {
        await loading.set(false)
    }
})

const addBook = async () => {
    try {
        if (editBookFormRef.value) {
            const errors = await editBookFormRef.value.validate()
            if (errors !== undefined) {
                return false
            }

            const book = {
                slug: editBookModal.form.slug,
                title: editBookModal.form.title,
                cover: editBookModal.form.cover,
                description: editBookModal.form.description,
                creator: loginUser.username + loginUser.id,
                createTime: new Date().getTime()
            } as Book
            const result = await booksApi.put(book)

            if (result) {
                dir.value = await booksApi.dir() as Book[]
                editBookModal.visible = false
            } else {
                Message.error('新建知识库失败')
            }

            return result
        }
    } catch (error) {
        Message.error('新建知识库失败')
        console.error('HomeView.vue: addBook()', error)
        return false
    }
};
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

.add-btn {
    position: fixed;
    right: 16px;
    top: 10px;
    z-index: 9999;
}
</style>