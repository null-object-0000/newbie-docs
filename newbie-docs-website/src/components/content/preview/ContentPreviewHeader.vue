<template>
    <header class="page__header">
        <a-breadcrumb v-if="getParent([docs], doc.parentSlug)">
            <template #separator>
                <icon-right />
            </template>

            <a-breadcrumb-item v-if="getParentParent([docs], doc.parentSlug)">
                <router-link :to="getParentParent([docs], doc.parentSlug)?.path || ''">
                    {{ getParentParent([docs], doc.parentSlug)?.title }}
                </router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
                <router-link :to="getParent([docs], doc.parentSlug)?.path || ''">
                    {{ getParent([docs], doc.parentSlug)?.title }}
                </router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>{{ doc.title }}</a-breadcrumb-item>
        </a-breadcrumb>
    </header>

    <a-button class="edit-btn" type="primary" v-if="userStore.isLogin" @click="onEdit">
        <template #icon>
            <icon-edit />
        </template>
        <template #default>编辑</template>
    </a-button>

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

const getParent = (data: Doc[], slug?: string): Doc | undefined => {
    if (slug === undefined) {
        return
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
}

const getParentParent = (data: Doc[], slug?: string): Doc | undefined => {
    if (slug === undefined) {
        return
    }

    for (const item of data) {
        if (item.slug === slug) {
            return getParent([docs.value], item.parentSlug);
        }
        if (item.child && item.child.length > 0) {
            const parent = getParentParent(item.child, slug);
            if (parent) {
                return parent;
            }
        }
    }
}
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