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
import EditorJS, { type OutputBlockData, I18nDictionary, EditorConfig } from "@editorjs/editorjs";
import { type BlockMutationEvent } from "@editorjs/editorjs/types/events/block";
// @ts-ignore
import Underline from '@editorjs/underline';
// @ts-ignore
import EParagraph from "@editorjs/paragraph";
// @ts-ignore
import EHeader from "@editorjs/header";
// @ts-ignore
import EImage from "@editorjs/image";
// @ts-ignore
import AttachesTool from '@editorjs/attaches';
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
// @ts-ignore
import DragDrop from 'editorjs-drag-drop';

import { ref, toRefs, type PropType } from "vue";
import type { CustomEditorConfig, NewbieEditor } from "@/types/global";
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

const docTitle = ref(docsStore.doc.title)
const content = ref(docsStore.doc.content)

const i18nMessages = {
    "ui": {
        "blockTunes": {
            "toggler": {
                "Click to tune": "点击调整",
                "or drag to move": "或拖动移动",
            },
        },
        "inlineToolbar": {
            "converter": {
                "Convert to": "转换为",
            }
        },
        "toolbar": {
            "toolbox": {
                "Add": "添加",
            }
        },
        "popover": {
            "Filter": "过滤",
            "Nothing found": "未找到",
        }
    },

    "toolNames": {
        "Text": "文本",
        "Heading": "标题",
        "Image": "图片",
        "Attachment": "附件",
        "List": "列表",
        "Checklist": "待办",
        "Quote": "引用",
        "Warning": "警告",
        "Code": "代码",
        "Delimiter": "分割线",
        "Link": "链接",
        "Raw HTML": "原始 HTML",
        "Table": "表格",

        "Bold": "加粗",
        "Italic": "斜体",
        "Marker": "标记",
        "InlineCode": "行内代码",
        "Underline": '下划线',
    },

    /**
     * Section for passing translations to the external tools classes
     */
    "tools": {
        /**
         * Each subsection is the i18n dictionary that will be passed to the corresponded plugin
         * The name of a plugin should be equal the name you specify in the 'tool' section for that plugin
         */
        "warning": { // <-- 'Warning' tool will accept this dictionary section
            "Title": "标题",
            "Message": "消息",
        },
        /**
         * Link is the internal Inline Tool
         */
        "link": {
            "Add a link": "添加链接",
        },
        /**
         * The "stub" is an internal block tool, used to fit blocks that does not have the corresponded plugin
         */
        "stub": {
            'Error': '错误',
            'The block can not be displayed correctly.': '该块无法正确显示。'
        },
        "image": {
            "Caption": "标题",
            "Select an Image": "选择图片",
            "With border": "添加边框",
            "Stretch image": "拉伸图片",
            "With background": "添加背景",
            "Couldn’t upload image. Please try another.": "无法上传图片，请尝试其他图片。",
        },
        "code": {
            "Enter a code": "输入代码",
        },
        "linkTool": {
            "Link": "链接",
            "Couldn't fetch the link data": "无法获取链接数据",
            "Couldn't get this link data, try the other one": "无法获取链接数据，请尝试其他链接",
            "Wrong response format from the server": "服务器返回的响应格式错误",
        },
        "header": {
            "Header": "标题",
            "Heading 1": '一级标题',
            "Heading 2": '二级标题',
            "Heading 3": '三级标题',
            "Heading 4": '四级标题',
            "Heading 5": '五级标题',
            "Heading 6": '六级标题',
        },
        "paragraph": {
            "Enter something": "输入内容",
        },
        "list": {
            "Ordered": "有序",
            "Unordered": "无序",
        },
        "table": {
            "Add column to left": "在左侧添加列",
            "Add column to right": "在右侧添加列",
            "Delete column": "删除列",
            "Add row above": "在上方添加行",
            "Add row below": "在下方添加行",
            "Delete row": "删除行",
            "Heading": "标题",
            "With headings": "添加标题",
            "Without headings": "不添加标题",
        },
        "quote": {

        }
    },

    /**
     * Section allows to translate Block Tunes
     */
    "blockTunes": {
        /**
         * Each subsection is the i18n dictionary that will be passed to the corresponded Block Tune plugin
         * The name of a plugin should be equal the name you specify in the 'tunes' section for that plugin
         *
         * Also, there are few internal block tunes: "delete", "moveUp" and "moveDown"
         */
        "delete": {
            "Delete": "删除",
            "Click to delete": "点击删除",
        },
        "moveUp": {
            "Move up": "上移"
        },
        "moveDown": {
            "Move down": "下移"
        }
    },
} as I18nDictionary

const i18nGetProxyAction = (from: string, { target, key, receiver, parentKey }: { target: any, key: string, receiver?: any, parentKey?: string }): any => {
    const value = Reflect.get(target, key, receiver)

    if (key === '') {
        return value
    }

    // if (key === 'ui') {
    //     console.info(from, 'i18nGetProxyAction', parentKey, key, value, typeof value)
    // }

    let fullKey = key
    if (parentKey) {
        fullKey = `${parentKey}.${key}`
    }

    if (typeof value === 'object') {
        return new Proxy(value, {
            get(target, key: string, receiver) {
                return i18nGetProxyAction(from + '.object', { target, key, receiver, parentKey: fullKey })
            }
        })
    }

    if (target === i18nMessages) {
        return value
    }

    if (value && typeof value === 'string' && value.length > 0) {
        // console.log('i18n', fullKey, value)
    } else {
        console.warn('Missing translation for', fullKey, { key })
    }

    return value
}

let i18nMessagesProxy = i18nMessages
if (import.meta.env.VITE_ENABLED_I18N_DEBUG === true) {
    // 代理 i18nMessages 对象，包括所有子对象，并且打印调用链
    i18nMessagesProxy = new Proxy(i18nMessages, {
        get(target, key: string, receiver) {
            return i18nGetProxyAction('i18nMessagesProxy.get', { target, key, receiver })
        }
    }) as I18nDictionary

    // 重写 Array.prototype.reduce 函数
    const originalReduce = Array.prototype.reduce;
    // @ts-ignore
    Array.prototype.reduce = function (callbackfn: (previousValue: any, currentValue: string, currentIndex: number, array: string[]) => any, initialValue: any): any {
        let fullKey = ''
        const proxiedCallback = (previousValue: any, currentValue: string, currentIndex: number, array: string[]) => {
            if (initialValue === i18nMessagesProxy) {
                fullKey = `${fullKey}.${currentValue}`
            }

            return callbackfn(previousValue, currentValue, currentIndex, array);
        };

        const results = originalReduce.call(this, proxiedCallback, initialValue);
        if (initialValue === i18nMessagesProxy) {
            return new Proxy(results as any, {
                get(target, key: string, receiver) {
                    return i18nGetProxyAction('array.reduce.results', { target, key, receiver, parentKey: fullKey.substring(1) })
                }
            })
        }
        return results;
    };
}

const defaultConfig = {
    tools: {
        /**
         * https://github.com/editor-js/paragraph
         */
        paragraph: {
            class: EParagraph,
            inlineToolbar: true,
            isInternal: true,
            config: {
                /**
                 * The placeholder. Will be shown only in the first paragraph when the whole editor is empty.
                 */
                placeholder: '',
                /**
                 * (default: ) Whether or not to keep blank paragraphs when saving editor datafalse
                 */
                preserveBlank: true
            }
        },

        /**
         * https://github.com/editor-js/header
         */
        header: {
            class: EHeader,
            inlineToolbar: ["marker", "link"],
            // config: {
            //     placeholder: editorConfig.value.headerPlaceholder || "",
            // },
            shortcut: "CMD+SHIFT+H",
        },

        /**
         * https://github.com/editor-js/image
         */
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

        /**
         * https://github.com/editor-js/attaches
         */
        attaches: {
            class: AttachesTool,
            config: {
                endpoint: 'http://localhost:8008/uploadFile'
            }
        },

        /**
         * https://github.com/editor-js/nested-list
         */
        list: {
            class: ENestedList,
            inlineToolbar: true,
            shortcut: "CMD+SHIFT+L",
            config: {
                defaultStyle: 'unordered'
            },
        },

        /**
         * https://github.com/editor-js/checklist
         */
        checklist: {
            class: EChecklist,
            inlineToolbar: true,
        },

        /**
         * https://github.com/editor-js/quote
         */
        quote: {
            class: EQuote,
            inlineToolbar: true,
            config: {
                quotePlaceholder: "Enter a quote",
                captionPlaceholder: "Quote's author",
            },
            shortcut: "CMD+SHIFT+O",
        },

        /**
         * https://github.com/editor-js/warning
         */
        warning: Warning,

        /**
         * https://github.com/editor-js/marker
         */
        marker: {
            class: Marker,
            shortcut: "CMD+SHIFT+M",
        },

        /**
         * https://github.com/editor-js/code
         */
        code: {
            class: CodeTool,
            shortcut: "CMD+SHIFT+C",
        },

        /**
         * https://github.com/editor-js/delimiter
         */
        delimiter: Delimiter,

        /**
         * https://github.com/editor-js/inline-code
         */
        inlineCode: {
            class: InlineCode,
            shortcut: "CMD+SHIFT+I",
        },

        /**
         * https://github.com/editor-js/link
         */
        linkTool: LinkTool,

        /**
         * https://github.com/editor-js/raw
         */
        raw: RawTool,

        /**
         * https://github.com/editor-js/embed
         */
        embed: Embed,

        /**
         * https://github.com/editor-js/table
         */
        table: {
            class: Table,
            inlineToolbar: true,
            shortcut: "CMD+ALT+T",
        },

        /**
         * https://github.com/editor-js/underline
         */
        underline: Underline
    },
    /**
     * Internationalzation config
     */
    i18n: {
        /**
         * @type {I18nDictionary}
         */
        messages: i18nMessagesProxy
    },
};

let editor: EditorJS;
const config = Object.assign(defaultConfig, editorConfig.value)

const onChange = (event?: BlockMutationEvent | BlockMutationEvent[] | Event, forceRemote?: boolean) => {
    if (editor && typeof editor.save === 'function') {
        editor.save().then((outputData) => {
            content.value = JSON.stringify(outputData.blocks);
            emit('onChange', event, { title: docTitle.value, content: content.value, forceRemote });
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

    docsStore.doc.title = docTitle.value
    onChange(event)
}

editor = new EditorJS({
    ...config,

    data: {
        blocks: (content.value ? JSON.parse(content.value) : []) as OutputBlockData[],
    },
    onReady: () => {
        console.log("Editor.js is ready to work!")
        new DragDrop(editor);

        editor.render({
            blocks: JSON.parse(content.value) as OutputBlockData[],
        });

        docsStore.refreshDocEditor({
            type: 2,

            getContent: async () => {
                const outputData = await editor.save()
                content.value = JSON.stringify(outputData.blocks);
                return content.value
            },
        } as NewbieEditor)
    },
    onChange: (api, event) => {
        onChange(event);
    },
});
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
    margin: 24px 0;
    font-size: 36px;
    font-weight: 800;
    line-height: 1.35em;
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

    padding-left: 0;
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
  