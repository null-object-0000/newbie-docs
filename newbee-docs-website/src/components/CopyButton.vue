<template>
    <component :is="mainTag" :aria-label="ariaLabel" :class="`${mainClass} ${classes}` + (copied ? ' copy-button__copied' : '')" @click="copy"
        @mouseleave="mouseleave">
        <div :class="mainClass + '__inner'">
            <div :class="mainClass + '__icon--initial'"><docs-icon-copy /></div>
            <div :class="mainClass + '__icon--success'"><docs-icon-check /></div>
        </div>
    </component>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue';

const { textToCopy } = defineProps({
    mainTag: {
        type: String,
        default: 'button',
        required: false,
    },
    mainClass: {
        type: String,
        default: 'copy-button',
        required: false,
    },
    ariaLabel: {
        type: String,
        default: 'Copy to the Clipboard',
        required: false,
    },
    textToCopy: {
        type: String,
        required: true,
    },
    classes: {
        type: String,
        default: '',
        required: false,
    },
})

const copied = ref(false)
const source = ref('')
const clipboard = useClipboard({ source })

const copy = () => {
    copied.value = true
    clipboard.copy(textToCopy)
}

const mouseleave = () => {
    setTimeout(() => copied.value = false, 5e2);
}
</script>