FROM node:20-alpine AS build

WORKDIR /app

ARG EXPO_PUBLIC_API_URL=/api
ARG EXPO_PUBLIC_WS_URL=/ws
ARG EXPO_PUBLIC_STUDENT_LINK_BASE_URL=/

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_WS_URL=$EXPO_PUBLIC_WS_URL
ENV EXPO_PUBLIC_STUDENT_LINK_BASE_URL=$EXPO_PUBLIC_STUDENT_LINK_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx expo export --platform web

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
