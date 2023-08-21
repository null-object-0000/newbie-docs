<template>
    <a-button class="edit-btn" type="primary"
        v-if="usersStore.loginUser.isAdminer || docsStore.doc.loginUserAuthType === 1 || docsStore.doc.loginUserAuthType === 2"
        @click="onEdit">
        <template #icon>
            <icon-edit />
        </template>
        <template #default>编辑</template>
    </a-button>
    <a-button class="login-btn" type="outline"
        v-else-if="usersStore.loginUser.isLogin === false && usersStore.loginUser.loginOauth2Url"
        :href="usersStore.loginUser.loginOauth2Url">
        <template #icon>
            <icon-github />
        </template>
        <template #default>登录</template>
    </a-button>
</template>

<script setup lang="ts">
import { useDocsStore } from '@/stores/doc';
import { useUsersStore } from '@/stores/user';

const usersStore = useUsersStore();
const docsStore = useDocsStore()

const emit = defineEmits(['onEdit']);

const onEdit = (event: Event) => {
    emit('onEdit', event);
};

</script>

<style>
.edit-btn,
.login-btn {
    position: fixed;
    right: 16px;
    top: 10px;
    z-index: 1000;
}
</style>