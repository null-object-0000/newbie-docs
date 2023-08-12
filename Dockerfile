# 构建 website
FROM node:20.4.0 as build-website

WORKDIR /app

COPY ./newbie-docs-website /app

RUN npm install npm pnpm -g && \
    pnpm install && \
    pnpm build

# 构建 server
FROM maven:3.8.7-openjdk-18-slim as build-server

WORKDIR /app

COPY ./newbie-docs-server-java /app

RUN mvn clean package -Dmaven.test.skip=true -Dspring-boot.run.profiles=production

# 部署
FROM ubuntu:latest

## 时区 Asia/Shanghai
ENV TZ=Asia/Shanghai

## 安装 nginx 和 curl
RUN apt-get update && \
    apt-get install -y nginx && \
    apt-get install -y curl

## 安装 jdk
RUN apt-get install -y openjdk-18-jdk

COPY /nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-website /app/dist /usr/share/nginx/html
COPY --from=build-server /app/target/newbie-docs-server-java.jar /app/server.jar

EXPOSE 80

## 启动 nginx 和 java
CMD ["bash", "-c", "nginx -g 'daemon off;' & java -jar /app/server.jar -Dspring-boot.run.profiles=production"]