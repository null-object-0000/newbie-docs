<template>
    <section class="table-of-content">
        <header class="table-of-content__header">大纲</header>
        <section class="table-of-content__list">
            <li class="table-of-content__list-item" :class="tag.classes" v-for="tag of config.tags">
                <a :href="tag.linkTarget">{{ tag.innerText }}</a>
            </li>
        </section>
    </section>
</template>

<script setup lang="ts">
import { Doc } from '@/types/global';
import { nextTick, reactive, watch, type PropType, toRefs } from 'vue';

interface Tag {
    linkTarget: string;
    innerText: string;
    classes: string;
}

const props = defineProps({
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    }
});

const { doc } = toRefs(props);

const config = reactive({ tags: [] as Tag[] })

const tocElementItemIndent = (number: number) => `table-of-content__list-item--indent-${number}x`

watch(doc, () => {
    nextTick(() => {
        const tags = Array.from(document.querySelectorAll('.block-header')) as HTMLElement[]

        config.tags = []
        for (const tag of tags) {
            const classes = []
            /**
             * Additional indent for h3-h6 headers
             */
            switch (tag.tagName.toLowerCase()) {
                case 'h3':
                    classes.push(tocElementItemIndent(1));
                    break;
                case 'h4':
                    classes.push(tocElementItemIndent(2));
                    break;
                case 'h5':
                    classes.push(tocElementItemIndent(3));
                    break;
                case 'h6':
                    classes.push(tocElementItemIndent(4));
                    break;
            }

            config.tags.push({
                linkTarget: tag.querySelector('a')?.getAttribute('href') || '',
                innerText: tag.innerText.trim(),
                classes: classes.join(' ')
            })
        }
    })
}, { immediate: true });
</script>