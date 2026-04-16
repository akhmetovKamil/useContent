FROM node:22-alpine AS builder

ARG API_BASE_URL
ARG RPC_URL_11155111
ARG RPC_URL_84532
ARG RPC_URL_11155420
ARG RPC_URL_421614
ARG RPC_URL_8453
ARG RPC_URL_10
ARG RPC_URL_42161

ENV API_BASE_URL=$API_BASE_URL
ENV RPC_URL_11155111=$RPC_URL_11155111
ENV RPC_URL_84532=$RPC_URL_84532
ENV RPC_URL_11155420=$RPC_URL_11155420
ENV RPC_URL_421614=$RPC_URL_421614
ENV RPC_URL_8453=$RPC_URL_8453
ENV RPC_URL_10=$RPC_URL_10
ENV RPC_URL_42161=$RPC_URL_42161

WORKDIR /app

COPY ./frontend/package.json ./frontend/package-lock.json* ./frontend/

WORKDIR /app/frontend
RUN npm ci

WORKDIR /app
COPY ./frontend ./frontend
COPY ./contracts ./contracts

WORKDIR /app/frontend
RUN npm run build

FROM nginx:1.27-alpine

COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
