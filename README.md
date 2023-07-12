# newbie-docs

## 功能特性

## 开发计划

- [ ] 基于 Vue 3.0 完成 [codex.docs](https://github.com/codex-team/codex.docs) 所有能力
- [ ] 参考 [语雀](https://www.feishu.cn/product/docs)，完成知识库管理能力
- [ ] 参考 [飞书](https://www.yuque.com/dashboard)，扩充快类型
    - [ ] `标题`支持手动切换级别 1 - 9
    - [ ] 支持`高亮块`，参考飞书
    - [ ] 支持`图片块`，支持栅格布局，参考飞书

## 开发部署

### 本地开发

``` bash
cd newbie-docs-website
pnpm install
pnpm dev
```

``` bash
npm install -g commitizen

pnpm install
git cz
```

## 技术栈

- [Vue 3.0](https://cn.vuejs.org/)
- [Editor.js](https://github.com/codex-team/editor.js)
- [VueUse](https://vueuse.org/guide/)
- [YJS]()