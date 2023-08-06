<template>
    <div class="home-view">
        <a-row :gutter="40" justify="center">
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
    </div>

    <a-button class="add-btn" type="primary" v-if="userStore.isLogin" @click="editBookModal.visible = true">
        <template #icon>
            <icon-plus />
        </template>
        <template #default>新建</template>
    </a-button>

    <a-modal v-model:visible="editBookModal.visible" @before-ok="addBook">
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
import { useConfigStore } from "@/stores/config";
import { useUserStore } from '@/stores/user';
import { ref, reactive } from 'vue';
import { useBooksApi } from '@/api/books';
import { Book } from '@/types/global'
import { FormInstance } from '@arco-design/web-vue/es/form';
import { onBeforeMount } from "vue";
import { usePermissionsApi } from "@/api/permissions";

const userStore = useUserStore();
const configStore = useConfigStore();
const booksApi = useBooksApi('localStorage')
const premissionsApi = usePermissionsApi('localStorage')

configStore.setHeader('/', 'Newbie Docs');

const dir = ref<Book[]>([])

onBeforeMount(async () => {
    dir.value = await booksApi.dir() as Book[]
})

const editBookFormRef = ref<FormInstance>();
const editBookModal = reactive({
    visible: false,
    form: {
        slug: '',
        title: '',
        cover: '',
        description: '',
    },
})

const addBook = async () => {
    if (editBookFormRef.value) {
        const errors = await editBookFormRef.value.validate()
        if (errors !== undefined) {
            return false
        }

        const book = {
            id: Math.ceil(Math.random() * 1000000000),
            slug: editBookModal.form.slug,
            title: editBookModal.form.title,
            cover: editBookModal.form.cover,
            description: editBookModal.form.description,
            creaotr: userStore.name + userStore.id,
            createTime: new Date().getTime()
        } as Book
        const result = await booksApi.put(book)

        if (result) {
            // TODO: 默认给自己加一个管理员权限，后期应该是逻辑放在后端
            await premissionsApi.put({
                id: Math.ceil(Math.random() * 100000000000000),
                authType: "adminer",
                dataType: 'book',
                dataId: book.id,
                dataFlag: book.slug,
                owner: userStore.name + userStore.id,
                ownerType: 'user'
            })

            dir.value = await booksApi.dir() as Book[]
            editBookModal.visible = false
        }

        return result
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