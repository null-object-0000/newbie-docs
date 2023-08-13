# newbie-docs

## 主要功能

- :ledger: 像书一样的知识库
- :gift: 多样的在线编辑器
- :running:	便捷的私有化部署
- :blush:	个人和团队都适用
  
详细 [业务逻辑](./BusinessLogic.md) 介绍

## 开发计划

### v1.0.0

- [x] 基于 `Vue 3.0` 完成 [codex.docs](https://github.com/codex-team/codex.docs) 所有能力
- [ ] 支持多种类型编辑器
  - [ ] 基于 [wangEditor 5](https://www.wangeditor.com/) 实现富文本编辑器，参考 [腾讯文档](https://docs.qq.com/)
  - [ ] 基于 [Editor.js](https://github.com/codex-team/editor.js) 实现块式编辑器，参考 [飞书](https://www.feishu.cn/product/docs)
  - [ ] 基于 [mavonEditor](https://github.com/hinesboy/mavonEditor) 实现 Markdown 编辑器
- [x] 支持通过知识库管理文档，参考 [语雀](https://www.yuque.com/dashboard)
- [x] 实现基于 `LocalStorage` 的客户端存储
- [x] 实现基于 `Java` 的 RESTful API 用以服务端 `Amazon S3` 存储
- [ ] 支持知识库、文档的权限管理
- [x] 支持通过 Docker 部署
  - [x] newbie-docs-website
  - [x] newbie-docs-server-java
- [ ] 支持基于 OAuth2 的第三方登录

> `LocalStorage` 存储实现不支持权限管理能力，此时默认所有人都拥有所有知识库、文档的管理员权限

### v2.0.0
- [ ] 基于 `YJS` 实现文档协同编辑
- [ ] 移动端适配 + 暗黑模式
- [ ] 实现多语言的 RESTful API 用以服务端 `Amazon S3` 存储
  - [ ] 基于 `Node.js` 的 RESTful API

### v3.0.0
- [ ] 支持更丰富的在线编辑器
  - [ ] 基于 [Luckysheet](https://github.com/dream-num/Luckysheet) 的表格编辑能力
- [ ] 文档的多版本管理 + 支持从各平台导入文档

## 开发部署

### 本地开发

#### website

- node 20
- pnpm 8.6

``` bash
# 环境配置（windows）
copy .\newbie-docs-website\.env .\newbie-docs-website\.env.local

# 本地运行
pnpm install
pnpm dev

# 代码提交
npm install -g commitizen
pnpm run website:commit

# 本地构建
pnpm build
```

#### java-server

- jdk 17
- maven 3.9

``` bash
cd .\newbie-docs-server-java\

# 环境配置（windows）
copy .\src\main\resources\application.properties .\src\main\resources\application-local.properties
# 环境配置（linux）
cp src/main/resources/application.properties src/main/resources/application-local.properties

# 本地运行（windows）
mvn clean package -Dmaven.test.skip=true
java -jar .\target\newbie-docs-server-java.jar -Dspring.profiles.active=local
# 本地运行（linux）
mvn clean package -Dmaven.test.skip=true
java -jar target/newbie-docs-server-java.jar -Dspring.profiles.active=local
```

### Docker 部署

#### java-server + website

``` bash
# 构建镜像
docker build -t newbie-docs:latest .
# 运行容器
docker run -d -p 8080:80 --name newbie-docs newbie-docs:latest
```

#### nginx + website

``` bash
# 构建镜像
cd .\newbie-docs-website\
docker build -t newbie-docs:latest .
# 运行容器
docker run -d -p 8080:80 --name newbie-docs newbie-docs:latest
```

## 技术栈

### website
- [Vue 3.0](https://cn.vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://cn.vitejs.dev/) + [Pinia](https://pinia.vuejs.org/zh/) + [Vue Router](https://next.router.vuejs.org/zh/)
- [Axios](https://axios-http.com/zh/)
- [VueUse](https://vueuse.org/guide/)
- [Arco Design](https://arco.design/)
- [Editor.js](https://github.com/codex-team/editor.js)
- [wangEditor 5](https://www.wangeditor.com/)
- [YJS](https://github.com/yjs/yjs)

### server
- [Spring Boot](https://spring.io/projects/spring-boot) + [Lombok](https://projectlombok.org/) + [MyBatis](https://mybatis.org/mybatis-3/zh/index.html)
- [HuTool](https://hutool.cn/)
- [FastJson 2.0](https://alibaba.github.io/fastjson2/)

### database
- [MySQL](https://www.mysql.com/cn/)
- [Amazon S3](https://aws.amazon.com/cn/s3/)