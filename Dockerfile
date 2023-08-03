FROM node:20.4.0

WORKDIR /app

COPY ./newbie-docs-website /app

RUN npm install npm pnpm -g && \
    pnpm install && \
    pnpm build

EXPOSE 80

CMD ["pnpm", "run", "preview"]