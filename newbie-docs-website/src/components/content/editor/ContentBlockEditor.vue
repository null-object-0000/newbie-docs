<template>
    parentId: {{ doc.parentId }}
    <section data-module="writing">
        <header class="writing-header">
            <div class="writing-header__inner-container">
                <div class="uri-input-wrapper">
                    <label for="uri-input">Id</label>
                    <input :disabled="true" type="text" id="uri-input" class="uri-input" name="uri-input"
                        placeholder="URI (Optional)" :value="doc.id">
                </div>
                <div class="select-wrapper">
                    <label for="parent">父级页面</label>
                    <select v-model="doc.parentId" id="parent" name="parent">
                        <option value="root">—</option>
                        <template v-for="rootItem of  docs.child ">
                            <option v-if="rootItem.id !== 'home'" :value="rootItem.id">{{ rootItem.title }}</option>
                            <template v-if="rootItem.child">
                                <template v-for="item of  rootItem.child ">
                                    <option :value="item.id">&nbsp;&nbsp;{{ item.title }}
                                    </option>
                                </template>
                            </template>
                        </template>
                    </select>
                </div>
                <div class="select-wrapper">
                    <label for="above">置于上方</label>
                    <select id="above" name="above">
                        <option value="0">—</option>
                        <template v-for=" item  of  getChild([docs], doc.parentId) ">
                            <option v-if="doc.parentId && item.id !== 'home' && item.id !== doc.id" :value="item.id">
                                &nbsp;&nbsp;{{ item.title }}
                            </option>
                        </template>
                    </select>
                </div>
                <div>
                    <label>&nbsp;&nbsp;&nbsp;</label>
                    <div class="flex_wrap">
                        <a @click="onChange()"
                            class="docs-button docs-button--warning docs-button--small docs-button--with-icon docs-button--with-label page__header-button">
                            <div class="docs-button__icon">
                                <docs-icon-pencil />
                            </div>
                            更新
                        </a>
                        <a @click="onPreview()"
                            class="docs-button docs-button--primary docs-button--small docs-button--with-icon docs-button--with-label page__header-button">
                            <div class="docs-button__icon">
                                <docs-icon-pencil />
                            </div>
                            预览
                        </a>
                    </div>
                </div>
            </div>
        </header>
        <div class="writing-editor">
            <div id="editorjs"></div>
        </div>
    </section>
</template>
  
<script setup lang="ts">
import EditorJS, { type API, I18nDictionary } from "@editorjs/editorjs";
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

import { toRefs, watch } from "vue";
import type { PropType } from "vue";

import type { Doc, CustomEditorConfig } from "../../../types/global";

import { useMagicKeys, whenever } from '@vueuse/core'

const { ctrl_s } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.ctrlKey && e.key === 's' && e.type === 'keydown') {
            e.preventDefault()
        }
    },
})

const props = defineProps({
    editorConfig: {
        type: Object as PropType<CustomEditorConfig>,
        default: () => { },
        required: false,
    },
    doc: {
        type: Object as PropType<Doc>,
        default: () => { },
        required: false,
    },
    docs: {
        type: Object as PropType<Doc>,
        required: true,
    },
});
const emits = defineEmits(["onChange", "onPreview"]);

const { editorConfig, doc } = toRefs(props);

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

const onChange = (api?: API, event?: BlockMutationEvent | BlockMutationEvent[], callback?: any) => {
    editor && editor.save().then((outputData) => {
        // 如果第一个块是 header 则将 header 的内容作为 title
        if (outputData.blocks && outputData.blocks.length > 0 && outputData.blocks[0].type === 'header') {
            doc.value.title = outputData.blocks[0].data.text;
        }
        doc.value.blocks = outputData.blocks;
        emits('onChange', event, outputData.blocks);
    });
};

const onPreview = () => {
    onChange(undefined, undefined, () => {
        emits('onPreview')
    })
}

config.data = {
    blocks: doc.value.blocks || [],
};
config.onChange = onChange

editor = new EditorJS(config);

watch(doc, () => {
    if (editor && editor.render) {
        editor.render({
            blocks: doc.value.blocks || [],
        });
    }
}, { immediate: true });

whenever(ctrl_s, () => {
    onChange()
})

const getChild = function (data: Doc[], id?: string): Doc[] | undefined {
    if (id === undefined) {
        return;
    }

    for (const item of data) {
        if (item.id === id) {
            return item.child;
        }

        if (item.child && item.child.length > 0) {
            const child = getChild(item.child, id);
            if (child) {
                return child;
            }
        }
    }
    return undefined;
}
</script>
  
<style>
.writing-editor #editorjs svg {
    fill: none;
}

.writing-editor #editorjs .tc-toolbox__toggler svg {
    fill: currentColor;
}

.writing-header__inner-container>* {
    flex: 0 1 25%;
}

.flex_wrap {
    width: 185px;
}
</style>
  