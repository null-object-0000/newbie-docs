<template>
    <a-modal class="book-settings-modal" v-model:visible="modalVisible" @before-ok="save" :mask-closable="false"
        :closable="false">
        <template #title>
            {{ form.id > 0 ? '编辑' : '新建' }}知识库
        </template>
        <a-form ref="editBookFormRef" :model="form" auto-label-width>
            <a-form-item field="slug" label="标识" extra="请用小写英文字母、数字、下划线、短横线组合，但只能以英文字母开头" :disabled="form.id > 0"
                :rules="[{ required: true, type: 'string', match: /^[a-z][a-z0-9_-]*$/ }]">
                <a-input v-model="form.slug" placeholder="请输入标识，例如：alle" />
            </a-form-item>
            <a-form-item field="title" label="名称" :rules="[{ required: true, type: 'string' }]">
                <a-input v-model="form.title" placeholder="请输入名称，例如：万象开放平台" />
            </a-form-item>
            <a-form-item field="description" label="描述">
                <a-input v-model="form.description" placeholder="请输入描述，例如：一个专业的低代码营销活动模板系统" />
            </a-form-item>
            <a-form-item field="cover" label="封面">
                <a-input disabled v-model="form.cover" placeholder="请上传封面图" />
                <a-upload :action="uploadImageApiUrl" :show-file-list="false" :preview="false"
                    style="width: auto; margin-left: 10px;" @before-upload="() => { form.cover = ''; return true; }"
                    @success="uploadImageFinished" @error="uploadImageFinished" />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup lang="ts">
import { useBooksApi } from '@/api/books';
import { useUsersStore } from '@/stores/user';
import { Book } from '@/types/global';
import { FileItem, FormInstance, Message } from '@arco-design/web-vue';
import { toRefs, computed, ref, PropType } from 'vue';

const uploadImageApiUrl = import.meta.env.VITE_REST_API_BASE_URL + import.meta.env.VITE_UPLOAD_IMAGE_API_URL

const { loginUser } = useUsersStore();

const booksApi = useBooksApi('localStorage')

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
        required: true,
    },
    modelValue: {
        type: Object as PropType<Book>,
        required: true,
    },
});

const emit = defineEmits(['update:visible', 'update:modelValue', 'saved'])

const { visible, modelValue } = toRefs(props);

const modalVisible = computed({
    get() {
        return visible.value
    },
    set(val) {
        emit('update:visible', val)
    }
})

const form = computed({
    get() {
        return modelValue.value
    },
    set(val) {
        emit('update:modelValue', val)
    }
})

const uploadImageFinished = (fileItem: FileItem) => {
    console.log('uploadImageFinished', fileItem)
    if (fileItem.response && fileItem.response.result && fileItem.response.result.length > 0) {
        form.value.cover = fileItem.response.result
    } else {
        Message.error('上传封面图失败')
    }
}

const editBookFormRef = ref<FormInstance>();

const save = async () => {
    try {
        if (editBookFormRef.value) {
            const errors = await editBookFormRef.value.validate()
            if (errors !== undefined) {
                return false
            }

            const book = {
                id: form.value.id,
                slug: form.value.slug,
                title: form.value.title,
                cover: form.value.cover,
                description: form.value.description,
                creator: loginUser.username + loginUser.id,
                createTime: new Date().getTime()
            } as Book
            const result = await booksApi.put(book)

            if (result) {
                // dir.value = await booksApi.dir() as Book[]
                modalVisible.value = false
            } else {
                Message.error('新建知识库失败')
            }

            emit('saved', result)

            return result
        }
    } catch (error) {
        Message.error('新建知识库失败')
        console.error('HomeView.vue: addBook()', error)
        return false
    }
};
</script>

<style>
.book-settings-modal .cover-image-preview img.arco-image-img {
    width: calc(100% - 12px);
    margin-left: 12px;
}
</style>