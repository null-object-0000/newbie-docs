<template>
    <header class="page__header">
        <a-breadcrumb v-if="getParents([docs], doc.parentSlug)" :max-count="3">
            <template #separator>
                <icon-right />
            </template>

            <a-breadcrumb-item v-for="parent in getParents([docs], doc.parentSlug)" :key="parent.slug">
                <router-link :to="parent.path || ''">{{ parent.title }}</router-link>
            </a-breadcrumb-item>

            <a-breadcrumb-item>{{ doc.title }}</a-breadcrumb-item>
        </a-breadcrumb>
    </header>

    <a-button class="edit-btn" type="primary"
        v-if="permission && (permission.authType === 'adminer' || permission.authType === 'editor')" @click="onEdit">
        <template #icon>
            <icon-edit />
        </template>
        <template #default>编辑</template>
    </a-button>

    <h1 class="page__title">{{ doc.title }}</h1>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import type { Doc, Permission } from '@/types/global';
import { useUserStore } from '@/stores/user';
import { usePermissionsApi } from '@/api/permissions';
import { watch } from 'vue';
import { ref } from 'vue';

const propsDef = defineProps({
    docs: {
        type: Object as () => Doc,
        required: true,
    },
    doc: {
        type: Object as () => Doc,
        required: true,
    },
});

const { docs, doc } = toRefs(propsDef);
const permission = ref<Permission>();

const emitsDef = defineEmits(['onEdit']);

const userStore = useUserStore();
const permissionsApi = usePermissionsApi('localStorage');

const onEdit = (event: Event) => {
    emitsDef('onEdit', event);
};

const getParent = (data: Doc[], slug?: string): Doc | undefined => {
    if (slug === undefined) {
        return;
    }

    for (const item of data) {
        if (item.slug === slug) {
            return item;
        }
        if (item.child && item.child.length > 0) {
            const parent = getParent(item.child, slug);
            if (parent) {
                return parent;
            }
        }
    }
};

const getParents = (data: Doc[], slug?: string): Doc[] => {
    const parents: Doc[] = [];
    let parent = getParent(data, slug);
    while (parent) {
        parents.unshift(parent);
        parent = getParent(data, parent.parentSlug);
    }
    return parents;
};

watch(doc, async () => {
    permission.value = await permissionsApi.get({
        dataType: 'doc',
        dataFlag: doc.value.bookSlug + '/' + doc.value.slug,
        ownerType: 'user',
        owner: userStore.name + userStore.id,
    });
}, { immediate: true },);
</script>

<style>
@media (max-width: 1050px) {
    .edit-btn {
        display: none;
    }
}

@media (min-width: 1050px) {
    .page__header {
        position: fixed;
        top: 12px;
        z-index: 10;
        max-width: var(--layout-width-main-col);
        min-width: 0;
        width: 100%;
    }

    .edit-btn {
        position: fixed;
        right: 16px;
        top: 10px;
        z-index: 10;
    }
}

.page__header .arco-breadcrumb-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>