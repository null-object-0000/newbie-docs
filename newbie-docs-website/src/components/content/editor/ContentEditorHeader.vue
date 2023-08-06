<template>
    <section class="content-editor-header" data-module="writing">
        <header class="writing-header">
            <div class="writing-header__inner-container">
                <a-form style="flex: 0 1 85%;" :model="doc" layout="inline">
                    <a-form-item field="slug" label="Slug">
                        <a-input v-model="doc.slug" :disabled="true" id="uri-input" class="uri-input" name="uri-input"
                            placeholder="please enter your slug..." />
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
import { useMagicKeys, whenever } from '@vueuse/core'

const props = defineProps({
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { doc } = toRefs(props);

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

watch(doc, () => {
    aboveSlug.value = null
}, { immediate: true });
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
  