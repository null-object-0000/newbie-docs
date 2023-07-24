<template>
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
                    <select v-model="parentId" id="parent" name="parent" @change="parentChange">
                        <option value="root">—</option>
                        <template v-for="rootItem of  docs.child ">
                            <option v-if="rootItem.id !== 'home' && rootItem.id !== doc.id" :value="rootItem.id">
                                {{ rootItem.id }} - {{ rootItem.title }}
                            </option>
                            <!-- 暂时不支持子级 -->
                            <!-- <template v-if="rootItem.child">
                                <template v-for="item of  rootItem.child ">
                                    <option :value="item.id">&nbsp;&nbsp;{{ item.title }}
                                    </option>
                                </template>
                            </template> -->
                        </template>
                    </select>
                </div>
                <div class="select-wrapper">
                    <label for="above">置于上方</label>
                    <select v-model="aboveId" id="above" name="above" @change="aboveChange">
                        <option>—</option>
                        <template v-for="item of getChild(doc.parentId)">
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

import { ref, toRefs, watch, reactive } from "vue";
import type { PropType } from "vue";

import type { Doc, CustomEditorConfig, DocsStorageEnum } from "@/types/global";

import { useMagicKeys, whenever } from '@vueuse/core'
import { useDocsApi } from "@/api/docs";
import { Message } from '@arco-design/web-vue';

const { ctrl_s } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.ctrlKey && e.key === 's' && e.type === 'keydown') {
            e.preventDefault()
        }
    },
})

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
const emits = defineEmits(["onChange", "onPreview"]);

const { space, spaceData, editorConfig, doc } = toRefs(props);

const docsApi = useDocsApi('localStorage', spaceData.value)

let parentId = ref(doc.value.parentId)
let aboveId = ref(null)

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
    console.log('onChange', api, event, callback)
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
    parentId.value = doc.value.parentId
    aboveId.value = null
    if (editor && editor.render) {
        editor.render({
            blocks: doc.value.blocks || [],
        });
    }
}, { immediate: true });

whenever(ctrl_s, () => {
    onChange()
})

const parentChange = () => {
    // 如果当前节点有子节点的话，不允许修改父级
    if (doc.value.child && doc.value.child.length > 0) {
        parentId.value = doc.value.parentId
        Message.error('当前节点有子节点，不允许修改父级')
        return
    }

    if (parentId.value) {
        const result = docsApi.changeParentId(space.value, doc.value.id, parentId.value)
        if (!result) {
            Message.error('修改父级失败')
        }
    }
    console.log('parentChange', parentId)
}

const getChild = (parentId?: string) => {
    if (parentId) {
        return docsApi.findChild(spaceData.value[space.value].array, parentId)
    }
}

const aboveChange = () => {
    const child = getChild(doc.value.parentId)
    let currentIndex = child!.findIndex((item) => {
        return item.id === doc.value.id
    })
    let aboveIndex = child!.findIndex((item) => {
        return item.id === aboveId.value
    })

    aboveIndex = aboveIndex === undefined ? -1 : aboveIndex

    if (currentIndex < aboveIndex) {
        aboveIndex = aboveIndex - 1
    }

    // 判断当前节点是否在目标节点的上面

    if (aboveIndex >= 0) {
        const result = docsApi.splice(space.value, doc.value.id, aboveIndex)
        if (!result) {
            Message.error('置于上方失败')
        }
    }
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
  