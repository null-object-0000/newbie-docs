# newbie-docs

## 开发计划

- [x] 基于 `Vue 3.0` 完成 [codex.docs](https://github.com/codex-team/codex.docs) 所有能力
- [ ] 多种编辑器支持
  - [ ] 富文本编辑器，参考 [腾讯文档](https://docs.qq.com/)
  - [ ] 块式编辑器，参考 [飞书](https://www.yuque.com/dashboard)
  - [ ] Markdown 编辑器
- [ ] 支持通过知识库管理文档集，参考 [语雀](https://www.feishu.cn/product/docs)
- [ ] 基于 `LocalStorage` 实现的客户端存储
- [ ] 多语言实现的 RESTful API 用以服务端存储
  - [ ] 基于 `Java` 实现的 RESTful API
  - [ ] 基于 `Node.js` 实现的 RESTful API
- [ ] 支持知识库、文档的权限管理
- [ ] 支持通过 Docker 部署
  - [x] website 项目
- [ ] 基于 `YJS` 实现文档协同编辑

## 开发部署

### 本地开发

``` bash
# 本地运行
pnpm install
pnpm dev

# 代码提交
npm install -g commitizen
git add .
git cz

# 本地构建
pnpm build
```

### Docker 部署

``` bash
# 构建镜像
docker build -t newbie-docs:latest .
# 运行容器
docker run -d -p 8080:80 --name newbie-docs newbie-docs:latest
```

## 技术栈

- [Vue 3.0](https://cn.vuejs.org/)
- [Editor.js](https://github.com/codex-team/editor.js)
- [wangEditor 5](https://www.wangeditor.com/)
- [VueUse](https://vueuse.org/guide/)
- [Arco Design](https://arco.design/)
- [YJS]()
