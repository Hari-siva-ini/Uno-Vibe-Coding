FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm install --workspace=shared --workspace=server

COPY shared ./shared
COPY server ./server

RUN npm run build -w shared && npm run build -w server

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm install --workspace=shared --workspace=server --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
