<template>
    <article class="page" data-module="page">
        <ContentPreviewHeader @on-edit="onEdit"></ContentPreviewHeader>

        <h1 class="page__title">{{ docsStore.doc.title }}</h1>

        <section class="page__content"
            :class="docsStore.doc.editor === 1 || docsStore.doc.editor === 2 ? 'newbie-docs-preview' : ''">
            <!-- block -->
            <template v-if="docsStore.doc.editor === 2" v-for="block of blocks">
                <div class="page__content-block">
                    <component v-if="isComponentExists('eb-' + block.type)" :is="'eb-' + block.type" :block="block" />
                    <div v-else style="background-color: pink;">eb-{{ block.type }}: {{ block.data }}</div>
                </div>
            </template>
            <!-- markdown -->
            <div class="page__content-markdown-preview markdown-body" v-else-if="docsStore.doc.editor === 3"
                v-html="markdown">
            </div>
            <!-- word -->
            <div class="page__content-word-preview" v-else v-html="docsStore.doc.content"></div>
        </section>

        <footer class="page__footer">
            <span class="updater" v-if="docsStore.doc.updater || docsStore.doc.creator">
                <icon-user />{{ docsStore.doc.updater || docsStore.doc.creator }}
            </span>
            <span class="update-time" v-if="formatTime">
                <icon-clock-circle />
                最后编辑于 {{ formatTime }}
            </span>
        </footer>
    </article>
</template>

<script setup lang="ts">
import ContentPreviewHeader from './ContentPreviewHeader.vue';
import { useDocsStore } from '@/stores/doc';
import { resolveComponent, computed, onMounted } from 'vue';
import { OutputBlockData } from '@editorjs/editorjs';
import { useDateFormat } from '@vueuse/core';
// @ts-ignore
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { onBeforeMount } from 'vue';
import { watch } from 'vue';
import { nextTick } from 'vue';

const docsStore = useDocsStore();

const emits = defineEmits(['onEdit']);

const onEdit = (event: Event) => {
    emits('onEdit', event);
};

const blocks = computed(() => {
    if (docsStore.doc.editor === 2 && docsStore.doc.content) {
        return (docsStore.doc.content ? JSON.parse(docsStore.doc.content) : []) as OutputBlockData[];
    }
});

const markdown = computed(() => {
    if (docsStore.doc.editor === 3 && docsStore.doc.content) {
        try {
            return JSON.parse(docsStore.doc.content).render.replace(`<h1><a id=\"markdown__0\"></a>${docsStore.doc.title}</h1>\n`, '');
        } catch (error) {

        }
    }
});

const formatTime = computed(() => {
    return useDateFormat(docsStore.doc.updateTime || docsStore.doc.createTime, 'YYYY年MM月DD日 HH:mm:ss').value
});

const isComponentExists = (name: string, maybeSelfReference?: boolean) => {
    const component = resolveComponent(name, maybeSelfReference);
    return component !== undefined && typeof component !== 'string';
};

const loadMarkdownCSS = async () => {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown.min.css';
        link.onload = (ev: Event) => {
            resolve(ev);
        };
        link.onerror = () => {
            reject(new Error('load markdown css failed'));
        };
        document.head.appendChild(link);
    });
}

onBeforeMount(() => {
    loadMarkdownCSS();
});

watch(() => docsStore.doc.content, () => {
    nextTick(() => {
        Prism.highlightAll();
    });
}, { immediate: true });
</script>

<style>
.page .page__header-time {
    width: 180px;
}

.page .page__footer {
    padding-top: 62px;
}

.page .page__footer .updater,
.page .page__footer .update-time {
    color: var(--color-text-3);
    font-size: 12px;
    padding-right: 10px;
}

.page .page__footer .updater svg,
.page .page__footer .update-time svg {
    margin-right: 10px;
}

.page__content-word-preview p,
.page__content-word-preview li {
    white-space: pre-wrap;
    /* 保留空格 */
}

.page__content-word-preview blockquote {
    border-left: 8px solid #d0e5f2;
    padding: 10px 10px;
    margin: 10px 0;
    background-color: #f1f1f1;
}

.page__content-word-preview table {
    border-collapse: collapse;
}

.page__content-word-preview td,
.page__content-word-preview th {
    border: 1px solid #ccc;
    min-width: 50px;
    height: 20px;
}

.page__content-word-preview th {
    background-color: #f1f1f1;
}

.page__content-word-preview ul,
.page__content-word-preview ol {
    padding-left: 20px;
}

.page__content-word-preview input[type="checkbox"] {
    margin-right: 5px;
}

div[data-w-e-type="video"] video {
    max-width: 100%;
}
</style>