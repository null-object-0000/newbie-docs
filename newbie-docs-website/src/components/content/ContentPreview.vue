<template>
    <article class="page" data-module="page">
        <header class="page__header">
            <div class="page__header-nav">
                <template v-if="getParent([docs], doc.parentId)">
                    <router-link v-if="getParentParent([docs], doc.parentId)" class="page__header-nav-item"
                        :to="getParentParent([docs], doc.parentId)?.path || ''">{{
                            getParentParent([docs], doc.parentId)?.title }}</router-link>
                    <docs-icon-arrow-right v-if="getParentParent([docs], doc.parentId)" />
                    <router-link class="page__header-nav-item" :to="getParent([docs], doc.parentId)?.path || ''">{{
                        getParent([docs], doc.parentId)?.title }}</router-link>
                    <docs-icon-arrow-right />
                </template>
            </div>
            <time class="page__header-time"> 最后编辑于{{ formatTime(doc.updateTime || doc.createTime) }}
            </time>
            <a v-if="userStore.isLogin" @click="onEdit"
                class="docs-button docs-button--primary docs-button--small docs-button--with-icon docs-button--with-label page__header-button">
                <div class="docs-button__icon">
                    <docs-icon-pencil />
                </div>
                编辑
            </a>
        </header>
        <h1 class="page__title">
            {{ doc.title }}
        </h1>
        <section class="page__content">
            <template v-for="(block, index) of doc.blocks">
                <div v-if="index !== 0 || block.type !== 'header'" class="page__content-block">
                    <component v-if="isComponentExists('eb-' + block.type)" :is="'eb-' + block.type" :block="block" />
                    <div v-else style="background-color: pink;">eb-{{ block.type }}: {{ block.data }}</div>
                </div>
            </template>
        </section>
    </article>
</template>

<script setup lang="ts">
import { resolveComponent, type PropType, watch, toRefs, nextTick } from 'vue';
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

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};

const formatTime = (time?: number) => {
    let date;
    if (time) {
        date = new Date(time);
    } else {
        date = new Date('1970-01-01')
    }

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

};

watch(doc, () => {
    nextTick(() => {
        // 判断是否有锚点，没有的话就不滚动到页面顶部
        if (window.location.hash) {
            const anchor = document.querySelector(window.location.hash);
            anchor && anchor.scrollIntoView();
        } else {
            window.scrollTo(0, 0)
        }
    })
}, { immediate: true })

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