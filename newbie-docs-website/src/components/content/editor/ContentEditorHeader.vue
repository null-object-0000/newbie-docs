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

            <a-button class="editor-tools-btn" @click="onChange" type="secondary">
                <template #icon>
                    <icon-save />
                </template>
                <template #default>保存</template>
            </a-button>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { ref, watch } from "vue";
import { useMagicKeys, whenever } from '@vueuse/core'
import { useDocsStore } from "@/stores/doc";
import { onUnmounted } from "vue";

const docsStore = useDocsStore();

const emit = defineEmits(["onChange", "onPreview"]);

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

watch(() => docsStore.doc.id, () => {
    aboveSlug.value = null
}, { immediate: true });
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
  