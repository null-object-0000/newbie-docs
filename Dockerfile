# 基础镜像，这里使用官方的 Node 镜像
FROM node:20.4.0 as build

# 设置工作目录
WORKDIR /app

# 将项目文件（package.json 和 package-lock.json）复制到容器中
COPY package*.json ./

# 安装依赖
RUN npm install pnpm -g
RUN pnpm install

# 将整个项目复制到容器中
COPY . .

# 构建项目
RUN pnpm run build

# 创建一个新的镜像，用于运行已构建的 Vue 项目
FROM nginx:1.25.1

# 将 Vue 项目构建结果从上一个构建阶段复制到 Nginx 静态文件目录
COPY --from=build /app/newbie-docs-website/dist /usr/share/nginx/html

# 替换默认的 Nginx 配置文件（可选，根据项目需求来自定义配置）
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口（默认为80，根据需要自定义）
EXPOSE 80

# 启动 Nginx 服务器
CMD ["nginx", "-g", "daemon off;"]
