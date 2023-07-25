<template>
    <div class="docs-content-home">
        <div class="docs-content-home__wrapper">
            <div class="docs-content-home__body">
                <div class="docs-content-home__header">
                    <docs-icon-book-type-default style="margin-right: 18px" /><span>{{ docs.title }}</span>

                    <span class="docs-content-home__more-actions" style="line-height: 16px; padding: 0; float: right;">
                        <svg width="1em" height="1em" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"
                            style="width: 16px; min-width: 16px; height: 16px;">
                            <path
                                d="M227.008 128c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20ZM148 128c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20Zm-78.992 0c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20Z"
                                fill="currentColor" fill-rule="nonzero"></path>
                        </svg>
                    </span>

                    <div class="docs-content-home__statistics">
                        <span class="docs-content-home__docCount">
                            <b class="docs-content-home__count">{{ getTotalDocCount([docs]) - 1 }}</b>文档
                        </span>
                        <span class="docs-content-home__wordCount">
                            <b class="docs-content-home__count">{{ getTotalWordCount([docs]) }}</b>字
                        </span>
                    </div>
                </div>

                <div v-if="docs.child!.length <= 1 || true" class="docs-content-home__default_content">
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
import { type PropType } from "vue";
import type { Doc } from "@/types/global";

defineProps({
    docs: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const getTotalDocCount = function (data: Doc[]): number {
    let count = 0;
    for (const item of data) {
        count += item.child!.length;
        if (item.child && item.child.length > 0) {
            count += getTotalDocCount(item.child);
        }
    }
    return count;
}

const getTotalWordCount = function (data: Doc[]): number {
    return 0;
}

</script>

<style scoped>
.docs-content-home {
    width: 100%;
    /* min-height: calc(100vh - 60px - var(--layout-height-header)); */
    background: linear-gradient(rgba(255, 255, 255, 0) 0px, rgb(255, 255, 255) 70vh, rgb(255, 255, 255) 100%), url("/img/cover_3.png") center top / 100% no-repeat;
    will-change: padding-left;
}

.docs-content-home__wrapper {
    padding: 64px 32px 0 32px;
    /* min-height: 100vh; */
    position: relative;
}

.docs-content-home__body {
    background: hsla(0, 0%, 100%, .9);
    border-radius: 12px;
    padding: 32px;
    min-height: calc(100vh - 64px - 32px - 2 * var(--layout-height-header));
    margin: 0 auto;
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
    color: #262626;
    font-weight: 700;
    margin-left: 18px;
}

.docs-content-home__more-actions {
    border: 1px solid #E7E9E8;
    border-radius: 6px;
    color: #262626;
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
    background: #FFFFFF;

    width: 32px;

    margin: 0;
}

.docs-content-home__statistics {
    margin: 6px 0 6px 58px;
}

.docs-content-home__docCount,
.docs-content-home__wordCount {
    font-size: 14px;
    color: #8A8F8D;
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
</style>