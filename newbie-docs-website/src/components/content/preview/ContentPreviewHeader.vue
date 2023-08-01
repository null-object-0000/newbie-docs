<template>
    <header class="page__header">
        <a-breadcrumb v-if="getParent([docs], doc.parentId)">
            <template #separator>
                <icon-right />
            </template>

            <a-breadcrumb-item v-if="getParentParent([docs], doc.parentId)">
                <router-link :to="getParentParent([docs], doc.parentId)?.path || ''">
                    {{ getParentParent([docs], doc.parentId)?.title }}
                </router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
                <router-link :to="getParent([docs], doc.parentId)?.path || ''">
                    {{ getParent([docs], doc.parentId)?.title }}
                </router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>{{ doc.title }}</a-breadcrumb-item>
        </a-breadcrumb>
        <time class="page__header-time">
            {{ formatTime(doc.updateTime || doc.createTime) }}
        </time>
        <a-button type="primary" v-if="userStore.isLogin" @click="onEdit">
            <template #icon>
                <icon-edit />
            </template>
            <template #default>编辑</template>
        </a-button>
    </header>
    <h1 class="page__title">
        {{ doc.title }}
    </h1>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue';
import type { Doc } from '@/types/global';
import { useUserStore } from '@/stores/user';

const props = defineProps({
    docs: {
        type: Object as PropType<Doc>,
        required: true,
    },
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { docs, doc } = toRefs(props);

const emits = defineEmits(['onEdit']);

const userStore = useUserStore();

const onEdit = (event: Event) => {
    emits('onEdit', event);
};

const formatTime = (time?: number) => {
    if (time) {
        const date = new Date(time);
        return `最后编辑于 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
};

const getParent = (data: Doc[], id?: string): Doc | undefined => {
    if (id === undefined) {
        return
    }

    for (const item of data) {
        if (item.id === id) {
            return item;
        }
        if (item.child && item.child.length > 0) {
            const parent = getParent(item.child, id);
            if (parent) {
                return parent;
            }
        }
    }
}

const getParentParent = (data: Doc[], id?: string): Doc | undefined => {
    if (id === undefined) {
        return
    }

    for (const item of data) {
        if (item.id === id) {
            return getParent([docs.value], item.parentId);
        }
        if (item.child && item.child.length > 0) {
            const parent = getParentParent(item.child, id);
            if (parent) {
                return parent;
            }
        }
    }
}
</script>

<style>
@media (min-width: 1050px) {
    .page__header {
        position: fixed;
        top: 12px;
        z-index: 10;
        max-width: var(--layout-width-main-col);
        min-width: 0;
        width: 100%;
    }
}

.page__header .page__header-time {
    width: 180px;
}

.page__header .arco-breadcrumb-item {
    max-width: 145px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>