<template>
    <footer class="page__footer">
        <span class="update-time" v-if="doc.updateTime || doc.createTime">
            <icon-clock-circle />最后编辑于 {{ formatTime(doc.updateTime || doc.createTime) }}
        </span>
    </footer>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue';
import type { Doc } from '@/types/global';
import { useUserStore } from '@/stores/user';

const props = defineProps({
    doc: {
        type: Object as PropType<Doc>,
        required: true,
    },
});

const { doc } = toRefs(props);

const formatTime = (time?: number) => {
    // 不足两位就补0
    const mapping = (number?: number) => {
        if (number !== undefined && number < 10) {
            return `0${number}`
        } else {
            return number
        }
    }

    if (time) {
        const date = new Date(time);
        return `${date.getFullYear()}年${mapping(date.getMonth() + 1)}月${mapping(date.getDate())}日 ${mapping(date.getHours())}:${mapping(date.getMinutes())}:${mapping(date.getSeconds())}`;
    }
};
</script>

<style>
.page__footer {
    padding-top: 62px;
}

.page__footer .update-time {
    color: var(--color-text-3);
    font-size: 12px;
}

.page__footer .update-time svg {
    margin-right: 10px;
}
</style>