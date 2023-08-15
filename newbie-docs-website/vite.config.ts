import { fileURLToPath, URL } from 'node:url'

import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import prismjs from 'vite-plugin-prismjs';

// https://vitejs.dev/config/
export const baseConfig = defineConfig({
  /**
   *  BASE_URL_TODO 请一定要以 / 结尾，例如：/mine/
   */
  base: '/',
  plugins: [
    vue(),
    prismjs({
      languages: ['html', 'xml', 'css', 'javascript', 'typescript', 'java', 'groovy', 'dockerfile', 'sql', 'bash'],
      plugins: [],
      theme: "solarizedlight",
      css: true,
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
      /**
       * BASE_URL_TODO 如果修改了项目基础路径，请一定要修改这里，例如：/mine/api
       */
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