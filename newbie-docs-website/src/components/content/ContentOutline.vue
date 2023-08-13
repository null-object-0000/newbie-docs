<template>
    <section class="table-of-content">
        <header class="table-of-content__header">大纲</header>
        <section class="table-of-content__list">
            <li class="table-of-content__list-item" :class="tag.classes" v-for="tag of config.tags">
                <router-link :to="''" v-if="configsStore.docEditMode" @click="tag.target.scrollIntoView()">
                    {{ tag.innerText }}
                </router-link>
                <router-link v-else :to="tag.linkTarget" @click="tag.target.scrollIntoView()">
                    {{ tag.innerText }}
                </router-link>
            </li>
        </section>
    </section>
</template>

<script setup lang="ts">
import { nextTick, reactive, watch } from 'vue';
import { useConfigsStore } from '@/stores/config';
import { useDocsStore } from '@/stores/doc';

const configsStore = useConfigsStore();
const docsStore = useDocsStore();

interface Tag {
    target: HTMLElement;
    linkTarget: string;
    innerText: string;
    classes: string;
}

const config = reactive({ tags: [] as Tag[] })

const tocElementItemIndent = (number: number) => `table-of-content__list-item--indent-${number}x`

const refreshTags = () => {
    let tags = [] as HTMLElement[]

    if (docsStore.doc.editor == 2) {
        tags = Array.from(document.querySelectorAll('.block-header,.ce-header')) as HTMLElement[]
    } else {
        // .page__content 下的所有 h1-h6 标签
        // FIXME: word 模式下没有锚点
        tags = Array.from(document.querySelectorAll('.page__content h1,.page__content h2,.page__content h3,.page__content h4,.page__content h5,.page__content h6')) as HTMLElement[]
    }

    config.tags = []

    // 看最大的是 h几
    const min = Math.min(...tags.map(tag => parseInt(tag.tagName.toLowerCase().replace('h', ''))))

    for (const tag of tags) {
        const classes = []
        /**
         * Additional indent for h3-h6 headers
         */
        switch (tag.tagName.toLowerCase()) {
            case 'h1':
                classes.push(tocElementItemIndent(1 - min + 1));
                break;
            case 'h2':
                classes.push(tocElementItemIndent(2 - min + 1));
                break;
            case 'h3':
                classes.push(tocElementItemIndent(3 - min + 1));
                break;
            case 'h4':
                classes.push(tocElementItemIndent(4 - min + 1));
                break;
            case 'h5':
                classes.push(tocElementItemIndent(5 - min + 1));
                break;
            case 'h6':
                classes.push(tocElementItemIndent(6 - min + 1));
                break;
        }

        config.tags.push({
            target: tag,
            linkTarget: tag.querySelector('a')?.getAttribute('href') || '',
            innerText: tag.innerText.trim(),
            classes: classes.join(' ')
        })
    }
}

watch(() => {
    return docsStore.doc.content
}, () => { nextTick(refreshTags) }, { immediate: true });
</script>

<style>
.table-of-content {
    --padding-x: 8px;
    border-left: 1px solid var(--color-border-2);
    box-sizing: border-box;
    margin: 30px 0;
    margin: var(--layout-padding-vertical) 0;
    max-height: 100%;
    overflow: auto;
    padding: 0 22px;
    padding: 0 var(--layout-padding-horizontal);
}

.table-of-content__header {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 21px;
    margin-bottom: 12px;
    padding: 0 var(--padding-x);
}

.table-of-content__list {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: 2px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.table-of-content__list-item {
    border-radius: 8px;
}

@supports (-webkit-mask-box-image: url("")) {
    .table-of-content__list-item {
        -webkit-mask-box-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width=%2724%27 height=%2724%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M0 10.387C0 1.833 1.833 0 10.387 0h3.226C22.167 0 24 1.833 24 10.387v3.226C24 22.167 22.167 24 13.613 24h-3.226C1.833 24 0 22.167 0 13.613v-3.226Z%27 fill=%27%23000%27/%3E%3C/svg%3E") 48% 41% 37.9% 53.3%;
        border-radius: 0;
    }
}

.table-of-content__list-item:hover {
    cursor: pointer;
}

.table-of-content__list-item--active,
.table-of-content__list-item:hover {
    background-color: #f3f6f8;
    background-color: var(--color-link-hover);
}

.table-of-content__list-item--indent-1x {
    margin-left: 6px;
}

.table-of-content__list-item--indent-2x {
    margin-left: 12px;
}

.table-of-content__list-item--indent-3x {
    margin-left: 18px;
}

.table-of-content__list-item--indent-4x {
    margin-left: 24px;
}

.table-of-content__list-item--indent-5x {
    margin-left: 30px;
}

.table-of-content__list-item--indent-6x {
    margin-left: 36px;
}

.table-of-content__list-item>a {
    display: block;
    font-size: 14px;
    letter-spacing: -0.01em;
    line-height: 150%;
    padding: 4px var(--padding-x);
}
</style>