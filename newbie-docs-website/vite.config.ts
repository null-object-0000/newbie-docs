import { fileURLToPath, URL } from 'node:url'

import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import prismjs from 'vite-plugin-prismjs';

// https://vitejs.dev/config/
export const baseConfig = defineConfig({
  define: {
    VITE_BUILD_TIME: new Date().getTime(),
  },
  plugins: [
    vue(),
    prismjs({
      languages: 'all',
      plugins: ["line-numbers"], // 配置显示行号插件
      theme: "solarizedlight", // 主题名称
      css: true, // 是否需要引入css
    })
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
      '/api': {
        target: 'http://localhost:8188/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    },
  }
})

// 判断是否是开发环境
const isDev = process.env.NODE_ENV === 'development'

export default mergeConfig(isDev ? proxyConfig : {}, baseConfig)