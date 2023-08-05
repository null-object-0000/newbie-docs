<template>
    <div class="home-view">
        <a-row :gutter="40" justify="center">
            <a-col flex="360px" v-for="i of 2" :style="{ marginBottom: '20px' }">
                <a style="color: unset; text-decoration: unset;" href="/alle">
                    <a-card :style="{ width: '360px' }">
                        <template #actions>
                            <span class="icon-hover">
                                <IconThumbUp />
                            </span>
                            <span class="icon-hover">
                                <IconShareInternal />
                            </span>
                            <span class="icon-hover">
                                <IconMore />
                            </span>
                        </template>
                        <template #cover>
                            <div :style="{ height: '204px', overflow: 'hidden', }">
                                <img :style="{ width: '100%', transform: 'translateY(-20px)' }" alt="dessert"
                                    src="https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a20012a2d4d5b9db43dfc6a01fe508c0.png~tplv-uwbnlip3yd-webp.webp" />
                            </div>
                        </template>
                        <a-card-meta>
                            <template #title>
                                万象开放平台 {{ i }}
                            </template>
                            <template #description>
                                This is the description {{ i }}
                            </template>
                            <template #avatar>
                                <div :style="{ display: 'flex', alignItems: 'center', color: '#1D2129' }">
                                    <a-avatar :size="24" :style="{ marginRight: '8px' }">
                                        A
                                    </a-avatar>
                                    <a-typography-text>Username</a-typography-text>
                                </div>
                            </template>
                        </a-card-meta>
                    </a-card>
                </a>
            </a-col>
        </a-row>
    </div>
</template>

<script setup lang="ts">
import {
    IconThumbUp,
    IconShareInternal,
    IconMore,
} from '@arco-design/web-vue/es/icon';

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

configStore.setHeader('/', 'Newbie Docs');
</script>

<style scoped>
.home-view {
    box-sizing: border-box;
    width: 100%;
    padding: 40px;
    background-color: var(--color-fill-2);
}

.icon-hover {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: all 0.1s;
}

.icon-hover:hover {
    background-color: rgb(var(--gray-2));
}
</style>