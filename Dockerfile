FROM node:20.4.0 as build

WORKDIR /app

COPY ./newbie-docs-website /app

RUN npm install npm pnpm -g && \
    pnpm install && \
    pnpm build

# nginx
FROM nginx:1.25.1-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]