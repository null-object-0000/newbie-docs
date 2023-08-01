<template>
    <div ref="sidebarLinkRef" :class="[`${calcClassName()}-wrapper`, 'docs-sidebar-link']" :id="`docs-sidebar-${item.id}`"
        @click="jump2(item.path)">
        <div :class="[calcClassName(), active ? `${calcClassName()}--active` : '']">
            <template v-if="isList !== true">
                <span v-if="item.child && item.child.length > 0 && keywordIncludes(item.child.map(i => i.title))"
                    class="docs-sidebar__section-toggler" @click="(event: Event) => extend(event, item)">
                    <docs-icon-arrow-up v-if="item.expand" />
                    <docs-icon-arrow-down v-else />
                </span>
                <span v-else style="width: 30px;">
                    <icon-home class="home-icon" v-if="item.id === 'home'" />
                </span>
            </template>

            <span v-if="item.id === 'home' || editMode === false">
                {{ item.title }}
            </span>
            <a-input size="small" ref="renameInputRef" v-else v-model="docTitle">
                <template #append>
                    <icon-check @click="submitRenameTitle"></icon-check>
                </template>
            </a-input>

            <template v-if="item.id !== 'home' && editMode === false">
                <span class="tools-wrapper">
                    <a-dropdown trigger="click" position="bottom" @click="eventStopPropagation" @select="onSetting"
                        :popup-max-height="false">
                        <icon-more-vertical class="tools-btn" style="right: 42px;" />
                        <template #content>
                            <a-doption value="rename"><template #icon><icon-loop /></template>重命名</a-doption>
                            <a-doption value="edit"><template #icon><icon-edit /></template>编辑文档</a-doption>
                            <a-doption value="copyLink"><template #icon><icon-link /></template>复制链接</a-doption>
                            <a-doption value="openLink"><template #icon><icon-launch /></template>在新标签页打开</a-doption>
                            <a-doption value="copy"><template #icon><icon-copy /></template>复制</a-doption>
                            <a-doption value="delete"><template #icon><icon-delete /></template>删除</a-doption>
                        </template>
                    </a-dropdown>
                    <a-dropdown trigger="click" position="bottom" @click="eventStopPropagation" @select="onCreate">
                        <icon-plus class="tools-btn" style="right: 12px;" />
                        <template #content>
                            <a-doption value="block"><template #icon><icon-code-block /></template>Block</a-doption>
                            <a-doption value="word"><template #icon><icon-file /></template>Word</a-doption>
                            <a-doption disabled value="link"><template #icon><icon-link /></template>Link</a-doption>
                        </template>
                    </a-dropdown>
                </span>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Doc } from "@/types/global";
import { toRefs, nextTick, ref, watch, type PropType } from "vue";
import router from "@/router";
import { useConfigStore } from "@/stores/config";
import { onClickOutside } from '@vueuse/core'

const sidebarLinkRef = ref(null)

const configStore = useConfigStore();

const props = defineProps({
    item: {
        type: Object as PropType<Doc>,
        required: true,
    },
    isList: {
        type: Boolean,
        default: true,
        required: false,
    },
    active: {
        type: Boolean,
        default: false,
        required: false,
    },
    keyword: {
        type: String,
        default: "",
        required: false,
    },
    editMode: {
        type: Boolean,
        default: false,
        required: false,
    }
});

const emit = defineEmits(["onCreate", "onSetting", "onRenamed"]);

const { item, active, keyword, isList, editMode } = toRefs(props)

const extend = function (event: Event, item: Doc) {
    item.expand = !item.expand;
    event.preventDefault();
    event.stopPropagation();
};

const keywordIncludes = function (str?: string | string[]): boolean {
    if (str === undefined) {
        return false
    }

    if (keyword.value.length <= 0) {
        return true
    }

    if (Array.isArray(str)) {
        return str.some(i => keywordIncludes(i));
    } else {
        return str.toLowerCase().indexOf(keyword.value.toLowerCase()) !== -1;
    }
}

const jump2 = (path: string) => {
    configStore.docEditMode = false
    router.push(path)
}

const eventStopPropagation = (ev: Event) => {
    ev.stopPropagation()
    ev.preventDefault()
    ev.stopImmediatePropagation()
}

const onCreate = function (value: string | number | Record<string, any> | undefined, ev: Event) {
    emit("onCreate", ev, {
        parentId: item.value.id,
        editor: value
    })
}

const onSetting = function (value: string | number | Record<string, any> | undefined, ev: Event) {
    emit('onSetting', ev, {
        id: item.value.id,
        doc: item.value,
        action: value
    })
}

const calcClassName = function () {
    return isList.value ? "docs-sidebar__section-list-item" : "docs-sidebar__section-title";
};

const docTitle = ref('')
const renameInputRef = ref<HTMLElement | null>(null)

const submitRenameTitle = (ev: Event) => {
    emit('onRenamed', ev, {
        id: item.value.id,
        title: docTitle.value,
        doc: item.value
    })
}

onClickOutside(sidebarLinkRef, function (ev: Event) {
    if (editMode.value === false) {
        return
    }

    if (docTitle.value && docTitle.value.length > 0) {
        submitRenameTitle(ev)
    }
})

watch(item, () => {
    docTitle.value = item.value.title
}, { immediate: true })

watch(editMode, () => {
    if (editMode.value === true) {
        nextTick(() => {
            renameInputRef.value?.focus()
        })
    }
}, { immediate: true })
</script>


<style scoped>
.docs-sidebar__section-list-item--active,
.docs-sidebar__section-title--active {
    background: #EFF0F0;
    color: #262626;
    font-weight: 700;
    border-radius: 6px;
    border: 1.5px solid #EFF0F0;
}

.docs-sidebar__section-list-item,
.docs-sidebar__section-title {
    justify-content: flex-start;
}

.docs-sidebar__section-toggler {
    margin-right: 6px;
}

.docs-sidebar__section-list-item {
    padding-left: 38px;
}

.home-icon {
    margin-left: 5px;
}

.docs-sidebar__section-list-item,
.docs-sidebar__section-title {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    font-size: 14px;
}

.tools-wrapper {
    visibility: hidden;
    width: 75px;
    height: 13px;
}

.tools-wrapper .tools-btn {
    position: absolute;
}

.docs-sidebar-link:hover .tools-wrapper {
    display: inline-block;
    visibility: visible;
}
</style>
