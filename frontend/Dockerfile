FROM node:22-alpine AS builder

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