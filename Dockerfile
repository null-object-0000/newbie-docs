# 基础镜像，这里使用官方的 Node 镜像
FROM node:20.4.0

# 设置工作目录
WORKDIR /app

# 将整个项目复制到容器中
COPY . .

# 安装依赖
RUN npm install npm -g
RUN npm install pnpm -g
RUN pnpm install

# 暴露端口（默认为80，根据需要自定义）
EXPOSE 80

# 启动 Nginx 服务器
CMD ["pnpm", "run", "preview"]
