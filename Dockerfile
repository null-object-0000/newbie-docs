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
COPY --from=build-website /app/dist /app/src/main/resources/public

RUN mvn clean package -Dmaven.test.skip=true

# 部署
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY --from=build-server /app/target/newbie-docs-server-java.jar /app/server.jar

EXPOSE 80

CMD ["java", "-jar", "/app/server.jar", "-Dspring.profiles.active=production"]