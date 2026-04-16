FROM node:22-alpine AS builder

ARG VITE_API_BASE_URL
ARG VITE_RPC_URL_11155111
ARG VITE_RPC_URL_84532
ARG VITE_RPC_URL_11155420
ARG VITE_RPC_URL_421614
ARG VITE_RPC_URL_8453
ARG VITE_RPC_URL_10
ARG VITE_RPC_URL_42161

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_RPC_URL_11155111=$VITE_RPC_URL_11155111
ENV VITE_RPC_URL_84532=$VITE_RPC_URL_84532
ENV VITE_RPC_URL_11155420=$VITE_RPC_URL_11155420
ENV VITE_RPC_URL_421614=$VITE_RPC_URL_421614
ENV VITE_RPC_URL_8453=$VITE_RPC_URL_8453
ENV VITE_RPC_URL_10=$VITE_RPC_URL_10
ENV VITE_RPC_URL_42161=$VITE_RPC_URL_42161

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
