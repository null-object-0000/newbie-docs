<template>
    <section class="content-editor-header" data-module="writing">
        <header class="writing-header">
            <div class="writing-header__inner-container">
                <a-form style="flex: 0 1 85%;" :model="doc" layout="inline">
                    <a-form-item field="id" label="Id">
                        <a-input v-model="doc.id" :disabled="true" id="uri-input" class="uri-input" name="uri-input"
                            placeholder="please enter your id..." />
                    </a-form-item>
                    <a-form-item field="parentId" label="父级">
                        <a-select v-model="parentId" id="parent" name="parent" @change="parentChange"
                            :trigger-props="{ autoFitPopupMinWidth: true }">
                            <a-option value="root">—</a-option>
                            <template v-for="rootItem of  docs.child ">
                                <a-option v-if="rootItem.id !== 'home' && rootItem.id !== doc.id" :value="rootItem.id">
                                    {{ rootItem.id }} - {{ rootItem.title }}
                                </a-option>
                                <!-- 暂时不支持子级 -->
                                <!-- <template v-if="rootItem.child">
                                        <template v-for="item of  rootItem.child ">
                                            <a-option :value="item.id">&nbsp;&nbsp;{{ item.title }}
                                            </a-option>
                                        </template>
                                    </template> -->
                            </template>
                        </a-select>
                    </a-form-item>
                    <a-form-item field="aboveId" label="置于">
                        <a-select v-model="aboveId" id="above" name="above" @change="aboveChange"
                            :trigger-props="{ autoFitPopupMinWidth: true }">
                            <a-option>—</a-option>
                            <template v-for="item of getChild(doc.parentId)">
                                <a-option v-if="doc.parentId && item.id !== 'home' && item.id !== doc.id" :value="item.id">
                                    &nbsp;&nbsp;{{ item.title }}
                                </a-option>
                            </template>
                        </a-select>
                    </a-form-item>
                </a-form>

                <div class="editor-tools" style="flex: 0 1 15%;">
                    <label>&nbsp;&nbsp;&nbsp;</label>
                    <div class="flex_wrap">
                        <a-button class="editor-tools-btn" @click="onChange" type="secondary">
                            <template #icon>
                                <icon-save />
                            </template>
                            <template #default>更新</template>
                        </a-button>

                        <a-button class="editor-tools-btn" @click="onPreview" type="primary">
                            <template #icon>
                                <icon-eye />
                            </template>
                            <template #default>预览</template>
                        </a-button>
                    </div>
                </div>
            </div>
        </header>
    </section>
</template>
  
<script setup lang="ts">
import { ref, toRefs, watch, type PropType } from "vue";
import type { Doc } from "@/types/global";
import { useDocsApi } from "@/api/docs";
import { Message } from '@arco-design/web-vue';
import { useMagicKeys, whenever } from '@vueuse/core'

const props = defineProps({
    space: {
        type: String,
        required: true,
    },
    spaceData: {
        type: Object,
        required: true,
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

const { space, spaceData, doc } = toRefs(props);

const emit = defineEmits(["onChange", "onPreview"]);

const docsApi = useDocsApi('localStorage', spaceData.value)

let parentId = ref(doc.value.parentId)
let aboveId = ref(null)

const { ctrl_s } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.ctrlKey && e.key === 's' && e.type === 'keydown') {
            e.preventDefault()
        }
    },
})

whenever(ctrl_s, () => {
    onChange(new Event('ctrl_s'))
})

const onChange = (event: Event) => {
    emit('onChange', event);
};

const onPreview = (event: Event) => {
    emit('onPreview', event)
}

watch(doc, () => {
    parentId.value = doc.value.parentId
    aboveId.value = null
}, { immediate: true });

const parentChange = async () => {
    // 如果当前节点有子节点的话，不允许修改父级
    if (doc.value.child && doc.value.child.length > 0) {
        parentId.value = doc.value.parentId
        Message.error('当前节点有子节点，不允许修改父级')
        return
    }

    if (parentId.value) {
        const result = await docsApi.changeParentId(space.value, doc.value.id, parentId.value)
        if (!result) {
            Message.error('修改父级失败')
        }
    }
}

const getChild = async (parentId?: string) => {
    if (parentId) {
        return await docsApi.findChild(spaceData.value[space.value].array, parentId)
    }
}

const aboveChange = async () => {
    const child = await getChild(doc.value.parentId)
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
        const result = await docsApi.splice(space.value, doc.value.id, aboveIndex)
        if (!result) {
            Message.error('置于上方失败')
        }
    }
}
</script>

<style scoped>
@media (max-width: 1050px) {
    .content-editor-header {
        display: none;
    }
}

@media (min-width: 1050px) {
    .content-editor-header {
        position: fixed;
        top: 12px;
        z-index: 10;
        max-width: var(--layout-width-main-col);
        min-width: 0;
        width: 100%;
    }

    .content-editor-header .writing-header {
        padding: 0;
    }

    .content-editor-header label {
        display: none;
    }
}

form.arco-form.arco-form-layout-inline .arco-form-item {
    width: 31.5%;
    margin: 0;
    padding: 0;
    margin-right: 8px;
    height: 34px;
}

.flex_wrap {
    width: 184px;
}

.flex_wrap .editor-tools-btn {
    margin-right: 10px;
}

.flex_wrap .editor-tools-btn:last-child {
    margin-right: 0;
}
</style>
  