FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/

RUN npm install --workspace=shared --workspace=client

COPY shared ./shared
COPY client ./client

RUN npm run build -w shared && npm run build -w client

FROM nginx:alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY docker/nginx-client.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
