<template>
    <div class="docs-content-home"
        :style="{ background: `linear-gradient(rgba(255, 255, 255, 0) 0px, rgb(255, 255, 255) 70vh, rgb(255, 255, 255) 100%), url('${randomCoverImg()}') center top / 100% no-repeat` }">
        <div class="docs-content-home__wrapper">
            <div class="docs-content-home__body">
                <div class="docs-content-home__header">
                    <docs-icon-book-type-default style="margin-right: 18px" />
                    <span v-if="editMode === false">
                        {{ title }}
                    </span>
                    <div v-else class="rename-title-input-wrapper">
                        <a-input size="large" ref="renameInputRef" v-model="docTitle">
                            <template #append>
                                <a-button @click="submitRenameTitle">
                                    <template #icon><icon-check></icon-check></template>
                                </a-button>
                            </template>
                        </a-input>
                    </div>


                    <a-dropdown @select="onSpaceSetting" position="br" :popup-max-height="false">
                        <a-button class="docs-content-home__more-actions"
                            style="line-height: 16px; padding: 0; float: right;">
                            <template #icon>
                                <icon-more />
                            </template>
                        </a-button>

                        <template #content>
                            <a-doption value="rename">
                                <template #icon><icon-loop /></template>
                                重命名
                            </a-doption>
                            <a-doption value="edit" disabled>
                                <template #icon><icon-edit /></template>
                                编辑首页
                            </a-doption>
                            <a-doption value="delete" disabled>
                                <template #icon><icon-delete /></template>
                                删除
                            </a-doption>
                        </template>
                    </a-dropdown>

                    <div class="docs-content-home__statistics">
                        <span class="docs-content-home__docCount">
                            <b class="docs-content-home__count">{{ totalDocCount }}</b>文档
                        </span>
                        <span class="docs-content-home__wordCount">
                            <b class="docs-content-home__count">{{ totalWordCount }}</b>字
                        </span>
                    </div>
                </div>

                <div v-if="totalDocCount <= 1 || true" class="docs-content-home__default_content">
                    <p> 👋
                        <text style="font-weight: bold; display: inline-block;">
                            欢迎来到知识库
                        </text>
                    </p>
                    <p>
                        <text style="text-indent: 2em; display: inline-block;">
                            知识库就像书一样，让多篇文档结构化，方便知识的创作与沉淀
                        </text>
                    </p>
                </div>
                <div v-else></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { toRefs, nextTick, type PropType } from "vue";
import { ref } from "vue";
import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore()

const props = defineProps({
    space: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    totalDocCount: {
        type: Number,
        default: 0,
        required: false,
    },
    totalWordCount: {
        type: Number,
        default: 0,
        required: false,
    },
});

const emit = defineEmits(["onChangeTitle"]);

const { space, title } = toRefs(props);
let editMode = ref(false)
let docTitle = ref('')
const renameInputRef = ref<HTMLElement | null>(null)

const randomCoverImg = () => {
    const maxIndex = 5
    const randomIndex = Math.floor(Math.random() * maxIndex) + 1
    return `/img/cover_${randomIndex}.png`
}

const onSpaceSetting = (value: string | number | Record<string, any> | undefined, ev: Event) => {
    console.log('onSpaceSetting', value, ev)
    if (value === 'rename') {
        docTitle.value = title.value
        editMode.value = true
        nextTick(() => {
            renameInputRef.value?.focus()
        })
    } else if (value === 'delete') {
        console.log('delete')
    }
}

const submitRenameTitle = (event: Event) => {
    if (docTitle.value && docTitle.value.length > 0) {
        emit('onChangeTitle', event, 'root', docTitle.value)
        configStore.setHeader('/', docTitle.value);
        document.title = '首页 - ' + docTitle.value
    }
    console.log('submitRenameTitle', docTitle.value)
    editMode.value = false
}
</script>

<style scoped>
.docs-content-home {
    width: 100%;
    will-change: padding-left;
}

.docs-content-home__wrapper {
    padding: 64px 32px 0 32px;
    position: relative;
}

.docs-content-home__body {
    background: hsla(0, 0%, 100%, 0.9);
    border-radius: 12px;
    padding: 32px;
    min-height: calc(100vh - 64px - 32px - 2 * var(--layout-height-header));
    margin: 0 auto;
}

body[arco-theme='dark'] .docs-content-home__body {
    background: hsla(0, 0%, 0%, 0.9);
}

@media (min-width: 1300px) {
    .docs-content-home__body {
        max-width: 696px;
    }
}

@media (min-width: 1440px) {
    .docs-content-home__body {
        max-width: 696px;
    }
}

@media (min-width: 1920px) {
    .docs-content-home__body {
        max-width: 1024px;
    }
}

.docs-content-home__header {
    font-size: 28px;
    color: var(--color-text-1);
    font-weight: 700;
    margin-left: 18px;
}

.docs-content-home__more-actions {
    border: 1px solid var(--color-border-1);
    border-radius: 6px;
    color: var(--color-text-1);
    text-align: center;
    padding: 7px;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 0 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    background: var(--color-bg-1);

    width: 32px;

    margin: 0;
}

.docs-content-home__statistics {
    margin: 6px 0 6px 58px;
}

.docs-content-home__docCount,
.docs-content-home__wordCount {
    font-size: 14px;
    color: var(--color-text-3);
    text-align: center;
}

.docs-content-home__docCount {
    margin: 0 33px 0 0;
}

.docs-content-home__wordCount {}

.docs-content-home__count {
    color: #585A5A;
    font-family: DIN Alternate Bold, Pingfang SC, Hiragino Sans GB, Helvetica, Droid Sans, Microsoft YaHei, Arial, sans-serif;
    font-size: 18px;
    margin-right: 8px;
    font-weight: 700;
}

.docs-content-home__default_content {
    margin: 60px 0 0;

    position: relative;
    z-index: 1;
    outline: none;
    white-space: pre-wrap;
    white-space: break-spaces;
    word-break: break-word;
    word-wrap: break-word;
    font-family: 'Chinese Quote', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-variant-ligatures: none;

    font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Segoe UI';

    font-size: 15px;
    line-height: 1.74;

    letter-spacing: initial;
}

.docs-content-home .rename-title-input-wrapper {
    width: 70%;
    display: inline-block;
    position: relative;
    top: -4px;
}
</style>

<style>
.rename-title-input-wrapper span.arco-input-append {
    padding: 0 2px;
}
</style>