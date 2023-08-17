<template>
    <!-- <section class="content-editor-header" data-module="writing">
        <header class="writing-header">
            <div class="writing-header__inner-container">
                <a-form auto-label-width :model="docsStore.doc" layout="inline">
                    <a-form-item field="slug" label="路由标识">
                        <a-input v-model="docsStore.doc.slug" :disabled="true" />
                    </a-form-item>
                </a-form>
            </div>
        </header>
    </section> -->

    <div class="editor-tools" style="flex: 0 1 15%;">
        <label>&nbsp;&nbsp;&nbsp;</label>
        <div class="flex_wrap">
            <a-button class="editor-tools-btn" @click="onPreview" type="primary">
                <template #icon>
                    <icon-eye />
                </template>
                <template #default>查看</template>
            </a-button>

            <a-button :loading="loading" class="editor-tools-btn" @click="onChange" type="secondary">
                <template #icon>
                    <icon-save />
                </template>
                <template #default>保存</template>
            </a-button>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { ref, watch, onBeforeMount, onBeforeUnmount, computed } from "vue";
import { useMagicKeys, whenever } from '@vueuse/core'
import { useDocsStore } from "@/stores/doc"; import { AxiosError } from "axios";
import { Message } from "@arco-design/web-vue";
import { useConfigsStore } from "@/stores/config";

const configsStore = useConfigsStore()
const docsStore = useDocsStore();

const emit = defineEmits(["onChange", "onPreview"]);

let aboveSlug = ref()
let docId = ref(-1)

const loading = computed(() => docsStore.docPuting)

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
    if (loading.value !== true) {
        emit('onChange', event);
    }
};

const onPreview = (event: Event) => {
    // 远程与本地一致性保证相关处理
    docsStore.onContentChange(new Event("on preview"), {
        title: docsStore.doc.title, content: docsStore.doc.content, forceRemote: true
    })

    emit('onPreview', event)
}

watch(() => docsStore.doc.id, () => {
    aboveSlug.value = null
}, { immediate: true });

const interval = ref(null as number | null)
onBeforeMount(() => {
    docId.value = docsStore.doc.id

    // 每隔 5s 主动刷新 lock
    interval.value = setInterval(() => {
        try {
            docsStore.docsApi.tryLock(docsStore.bookSlug, docId.value)
        } catch (error) {
            if (error instanceof AxiosError) {
                Message.error(error.message)
            }

            console.error(error)
        }
    }, 5000)
})

onBeforeUnmount(() => {
    if (interval.value) {
        clearInterval(interval.value)
    }

    docsStore.docsApi.tryUnlock(docsStore.bookSlug, docId.value)

    docId.value = -1
})

// 远程与本地一致性保证相关处理
watch(() => configsStore.docEditMode, (value) => {
    if (value) {
        window.addEventListener('beforeunload', window.docEditPutVersion.preventDefault);
    } else {
        window.removeEventListener('beforeunload', window.docEditPutVersion.preventDefault);
    }
}, { immediate: true })
</script>

<style scoped>
form.arco-form.arco-form-layout-inline .arco-form-item {
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
  