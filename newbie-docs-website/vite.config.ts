import { fileURLToPath, URL } from 'node:url'

import { defineConfig, mergeConfig, ProxyOptions } from 'vite'
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

const apiProxyUrl = baseConfig.base + 'api'
const oauth2ProxyUrl = baseConfig.base + 'oauth2'

const proxy = {

} as Record<string, string | ProxyOptions>;

proxy[apiProxyUrl] = {
  target: 'http://localhost:8188',
  changeOrigin: true,
  rewrite: (path) => path.replace(new RegExp(`^${apiProxyUrl.replaceAll('/', '\/')}`), apiProxyUrl),
}

console.log(apiProxyUrl, new RegExp(`^${apiProxyUrl.replaceAll('/', '\/')}`))

proxy[oauth2ProxyUrl] = {
  target: 'http://localhost:8188',
  changeOrigin: true,
  rewrite: (path) => path.replace(new RegExp(`^${oauth2ProxyUrl.replaceAll('/', '\/')}`), oauth2ProxyUrl),
}

export const proxyConfig = defineConfig({
  mode: 'development',
  server: {
    host: '0.0.0.0',
    proxy
  }
})

// 判断是否是开发环境
const isDev = process.env.NODE_ENV === 'development'

export default mergeConfig(isDev ? proxyConfig : {}, baseConfig)