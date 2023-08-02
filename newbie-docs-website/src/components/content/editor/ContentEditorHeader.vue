<template>
    <section class="content-editor-header" data-module="writing">
        <header class="writing-header">
            <div class="writing-header__inner-container">
                <a-form style="flex: 0 1 85%;" :model="doc" layout="inline">
                    <a-form-item field="slug" label="Slug">
                        <a-input v-model="doc.slug" :disabled="true" id="uri-input" class="uri-input" name="uri-input"
                            placeholder="please enter your slug..." />
                    </a-form-item>
                    <a-form-item field="parentSlug" label="父级">
                        <a-select v-model="parentSlug" id="parent" name="parent" @change="parentChange"
                            :trigger-props="{ autoFitPopupMinWidth: true }">
                            <a-option value="root">—</a-option>
                            <template v-for="rootItem of  docs.child ">
                                <a-option v-if="rootItem.slug !== 'home' && rootItem.slug !== doc.slug"
                                    :value="rootItem.slug">
                                    {{ rootItem.slug }} - {{ rootItem.title }}
                                </a-option>
                                <!-- 暂时不支持子级 -->
                                <!-- <template v-if="rootItem.child">
                                        <template v-for="item of  rootItem.child ">
                                            <a-option :value="item.slug">&nbsp;&nbsp;{{ item.title }}
                                            </a-option>
                                        </template>
                                    </template> -->
                            </template>
                        </a-select>
                    </a-form-item>
                    <a-form-item field="aboveSlug" label="置于">
                        <a-select v-model="aboveSlug" id="above" name="above" @change="aboveChange"
                            :trigger-props="{ autoFitPopupMinWidth: true }">
                            <a-option>—</a-option>
                            <template v-for="item of allDocChild">
                                <a-option v-if="item.slug !== 'home' && item.slug !== doc.slug" :value="item.slug">
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
                            <template #default>保存</template>
                        </a-button>

                        <a-button class="editor-tools-btn" @click="onPreview" type="primary">
                            <template #icon>
                                <icon-eye />
                            </template>
                            <template #default>查看</template>
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

let parentSlug = ref(doc.value.parentSlug)
let aboveSlug = ref()

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
    parentSlug.value = doc.value.parentSlug
    aboveSlug.value = null
}, { immediate: true });

const parentChange = async () => {
    // 如果当前节点有子节点的话，不允许修改父级
    if (doc.value.child && doc.value.child.length > 0) {
        parentSlug.value = doc.value.parentSlug
        Message.error('当前节点有子节点，不允许修改父级')
        return
    }

    if (parentSlug.value) {
        const result = await docsApi.changeParentSlug(space.value, doc.value.slug, parentSlug.value)
        if (!result) {
            Message.error('修改父级失败')
        }
    }
}

const allDocChild = ref<Doc[]>([])

const aboveChange = async () => {
    const child = allDocChild.value
    let currentIndex = child!.findIndex((item) => {
        return item.slug === doc.value.slug
    })
    let aboveIndex = child!.findIndex((item) => {
        return item.slug === aboveSlug.value
    })

    aboveIndex = aboveIndex === undefined ? -1 : aboveIndex

    if (currentIndex < aboveIndex) {
        aboveIndex = aboveIndex - 1
    }

    // 判断当前节点是否在目标节点的上面

    if (aboveIndex >= 0) {
        const result = await docsApi.splice(space.value, doc.value.slug, aboveIndex)
        if (!result) {
            Message.error('置于上方失败')
        }
    }
}

watch(() => doc.value.parentSlug, async () => {
    if (doc.value.parentSlug) {
        allDocChild.value = await docsApi.findChild(spaceData.value[space.value].array, doc.value.parentSlug) || []
    }
}, { immediate: true })
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
  