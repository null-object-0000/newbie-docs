# 构建
FROM node:18.17.1 as build

WORKDIR /app

COPY ./ /app

RUN npm install npm pnpm -g && \
    pnpm install && \
    pnpm build

# 部署
FROM nginx:1.25.1-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]