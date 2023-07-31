<template>
    <section data-module="writing">
        <ContentEditorHeader :space="space" :space-data="spaceData" :docs="docs" :doc="doc"
            @on-change="event => onChange(event, true)" @on-preview="onPreview"></ContentEditorHeader>
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

import { ref, toRefs, watch, reactive, type PropType } from "vue";

import type { Doc, CustomEditorConfig } from "@/types/global";

import ContentEditorHeader from "./ContentEditorHeader.vue";

const props = defineProps({
    space: {
        type: String,
        required: true,
    },
    spaceData: {
        type: Object,
        required: true,
    },
    editorConfig: {
        type: Object as PropType<CustomEditorConfig>,
        default: () => { },
        required: false,
    },
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
    docs: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { space, spaceData, editorConfig, doc } = toRefs(props);

const emit = defineEmits(["onChange", "onPreview"]);

let parentId = ref(doc.value.parentId)
let aboveId = ref(null)
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
                endpoints: {
                    byFile: '/api/transport/image',
                    byUrl: '/api/transport/fetch',
                },
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

const onChange = (event?: BlockMutationEvent | BlockMutationEvent[] | Event, showSuccessTips?: boolean) => {
    editor && editor.save().then((outputData) => {
        doc.value.content = outputData.blocks;
        emit('onChange', event, outputData.blocks, showSuccessTips);
    });
};

const onPreview = (event: Event) => {
    emit('onPreview', event)
}

const onTitleChange = (event: Event) => {
    // 判断是否为空，为空的话，不更新
    if (docTitle.value === '') {
        docTitle.value = doc.value.title
        return
    }

    doc.value.title = docTitle.value
}

config.data = {
    blocks: (doc.value.content || []) as OutputBlockData[],
};
config.onChange = function (api, event) {
    onChange(event);
};

editor = new EditorJS(config);

watch(doc, () => {
    docTitle.value = doc.value.title
    parentId.value = doc.value.parentId
    aboveId.value = null
    if (editor && editor.render) {
        editor.render({
            blocks: (doc.value.content || []) as OutputBlockData[],
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

    background: #fff;
    color: black;
}

.writing-editor .title-container input::-webkit-input-placeholder {
    color: #bfbfbf;
}
</style>
  