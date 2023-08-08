import { fileURLToPath, URL } from 'node:url'

import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export const baseConfig = defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});

export const proxyConfig = defineConfig({
  mode: 'development',
  server: {
    host: '0.0.0.0',
    proxy: {
      '/server': {
        target: 'http://localhost:8188/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/server/, '/server'),
      }
    },
  }
})

// 判断是否是开发环境
const isDev = process.env.NODE_ENV === 'development'

export default mergeConfig(isDev ? proxyConfig : {}, baseConfig)