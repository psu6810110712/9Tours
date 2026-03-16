FROM node:20-bookworm-slim AS build

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_TRACKING_ENABLED=true

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TRACKING_ENABLED=$VITE_TRACKING_ENABLED
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
