<template>
    <section data-module="writing" class="content-block-ediotr">
        <ContentEditorHeader @on-change="event => onChange(event, true)" @on-preview="onPreview">
        </ContentEditorHeader>
        <div class="writing-editor">
            <div class="title-container">
                <input v-model="docTitle" @change="onTitleChange" placeholder="请输入标题">
            </div>

            <div id="editorjs"></div>
        </div>
    </section>
</template>
  
<script setup lang="ts">
import EditorJS, { type OutputBlockData } from "@editorjs/editorjs";
import { type BlockMutationEvent } from "@editorjs/editorjs/types/events/block";
// @ts-ignore
import EHeader from "@editorjs/header";
// @ts-ignore
import EImage from "@editorjs/image";
// @ts-ignore
import ENestedList from "@editorjs/nested-list";
// @ts-ignore
import EChecklist from "@editorjs/checklist";
// @ts-ignore
import EQuote from "@editorjs/quote";
// @ts-ignore
import Warning from "@editorjs/warning";
// @ts-ignore
import Marker from "@editorjs/marker";
// @ts-ignore
import CodeTool from "@editorjs/code";
// @ts-ignore
import Delimiter from "@editorjs/delimiter";
// @ts-ignore
import InlineCode from "@editorjs/inline-code";
// @ts-ignore
import LinkTool from "@editorjs/link";
// @ts-ignore
import Embed from "@editorjs/embed";
// @ts-ignore
import RawTool from '@editorjs/raw';
// @ts-ignore
import Table from "@editorjs/table";

import { ref, toRefs, watch, type PropType } from "vue";
import type { CustomEditorConfig } from "@/types/global";
import ContentEditorHeader from "./ContentEditorHeader.vue";
import { useDocsStore } from "@/stores/doc";
import { useFilesApi } from "@/api";
import { AxiosError } from "axios";
import { Message } from "@arco-design/web-vue";

const docsStore = useDocsStore();

const props = defineProps({
    editorConfig: {
        type: Object as PropType<CustomEditorConfig>,
        default: () => { },
        required: false,
    },
});

const { editorConfig } = toRefs(props);

const emit = defineEmits(["onChange", "onPreview", "onChangeTitle"]);

const title = ref('')
const docTitle = ref('')

const defaultConfig = {
    tools: {
        /**
         * Each Tool is a Plugin. Pass them via 'class' option with necessary settings {@link docs/tools.md}
         */
        header: {
            class: EHeader,
            inlineToolbar: ["marker", "link"],
            // config: {
            //     placeholder: editorConfig.value.headerPlaceholder || "",
            // },
            shortcut: "CMD+SHIFT+H",
        },

        image: {
            class: EImage,
            inlineToolbar: true,
            config: {
                types: 'image/*, video/mp4',
                field: 'file',
                endpoints: {
                    byFile: import.meta.env.VITE_REST_API_BASE_URL + import.meta.env.VITE_UPLOAD_IMAGE_API_URL,
                    byUrl: '/api/transport/fetch',
                },
                uploader: {
                    /**
                     * Upload file to the server and return an uploaded image data
                     * @param {File} file - file selected from the device or pasted by drag-n-drop
                     * @return {Promise.<{success, file: {url}}>}
                     */
                    async uploadByFile(file: File): Promise<{ success: number; file: { url: string }; }> {
                        return useFilesApi().uploadImage(file)
                            .then((url) => {
                                return {
                                    success: 1,
                                    file: { url }
                                }
                            }).catch((error) => {
                                if (error instanceof AxiosError) {
                                    Message.error(error.message)
                                }

                                console.error(error)

                                return {
                                    success: 0,
                                    file: { url: '' }
                                }
                            })
                    }
                }
            },
        },

        list: {
            class: ENestedList,
            inlineToolbar: true,
            shortcut: "CMD+SHIFT+L",
            config: {
                defaultStyle: 'unordered'
            },
        },

        checklist: {
            class: EChecklist,
            inlineToolbar: true,
        },

        quote: {
            class: EQuote,
            inlineToolbar: true,
            config: {
                quotePlaceholder: "Enter a quote",
                captionPlaceholder: "Quote's author",
            },
            shortcut: "CMD+SHIFT+O",
        },

        warning: Warning,

        marker: {
            class: Marker,
            shortcut: "CMD+SHIFT+M",
        },

        code: {
            class: CodeTool,
            shortcut: "CMD+SHIFT+C",
        },

        delimiter: Delimiter,

        inlineCode: {
            class: InlineCode,
            shortcut: "CMD+SHIFT+C",
        },

        linkTool: LinkTool,

        raw: RawTool,

        embed: Embed,

        table: {
            class: Table,
            inlineToolbar: true,
            shortcut: "CMD+ALT+T",
        },
    },
    /**
     * Internationalzation config
     */
    i18n: {
        /**
         * @type {I18nDictionary}
         */
        messages: {
            /**
             * Section for translation Tool Names: both block and inline tools
             */
            toolNames: {
                Heading: "标题",
                Quote: "引用",
                Image: "图片",
                Text: "文本",
                List: "列表",
                Warning: "警告",
                Checklist: "清单",
                Code: "代码",
                Delimiter: "分割线",
                "Raw HTML": "HTML代码",
                Table: "表格",
                Link: "链接",
                Marker: "标记",
                Bold: "加粗",
                Italic: "斜体",
                InlineCode: "行内代码"
            },
            "blockTunes": {
                "delete": {
                    "Delete": "删除"
                },
                "moveUp": {
                    "Move up": "上移"
                },
                "moveDown": {
                    "Move down": "下移"
                }
            },
        },
    }
};

let editor: EditorJS;
const config = Object.assign(defaultConfig, editorConfig.value)

const onChange = (event?: BlockMutationEvent | BlockMutationEvent[] | Event, forceRemote?: boolean) => {
    if (editor && typeof editor.save === 'function') {
        editor.save().then((outputData) => {
            docsStore.doc.content = JSON.stringify(outputData.blocks);
            emit('onChange', event, { content: docsStore.doc.content, forceRemote });
        });
    }
};

const onPreview = (event: Event) => {
    emit('onPreview', event)
}

const onTitleChange = async (event: Event) => {
    // 判断是否为空，为空的话，不更新
    if (docTitle.value === '') {
        docTitle.value = docsStore.doc.title
        return
    }

    title.value = docTitle.value
    docsStore.doc.title = docTitle.value
    onChange(event)
}

config.data = {
    blocks: (docsStore.doc.content ? JSON.parse(docsStore.doc.content) : []) as OutputBlockData[],
};
config.onChange = function (api, event) {
    onChange(event);
};

editor = new EditorJS(config);

watch(() => docsStore.doc.id, () => {
    docTitle.value = docsStore.doc.title
    title.value = docTitle.value
    if (editor && typeof editor.render === 'function') {
        editor.render({
            blocks: JSON.parse(docsStore.doc.content) as OutputBlockData[],
        });
    }
}, { immediate: true });
</script>
  
<style>
.writing-editor #editorjs svg {
    fill: none;
}

.writing-editor #editorjs .tc-toolbox__toggler svg {
    fill: currentColor;
}

#editorjs .ce-inline-toolbar,
#editorjs .ce-conversion-toolbar,
#editorjs .ce-conversion-tool__icon {
    background-color: var(--color-bg-1);
    border-color: var(--color-border-1);
}

#editorjs .ce-toolbar__plus,
#editorjs .ce-toolbar__settings-btn {
    color: var(--color-text-1)
}
</style>

<style scoped>
.writing-editor .title-container {
    padding: 20px 0;
}

.writing-editor .title-container input {
    font-weight: 700;
    font-size: 36px;
    border: 0;
    outline: none;
    width: 100%;
    line-height: 1;

    background: var(--color-bg-1);
    color: var(--color-text-1);
}

.writing-editor .title-container input::-webkit-input-placeholder {
    color: var(--color-text-4);
}
</style>

<style>
.content-block-ediotr .editor-tools {
    position: fixed;
    right: 16px;
    top: -5px;
    z-index: 1000;
}
</style>
  