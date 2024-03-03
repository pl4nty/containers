FROM node:21.6.2 AS build-env
WORKDIR /app

COPY package*.json ./
# lock wasn't updated so npm ci fails
RUN npm install

COPY . .
RUN npm run build

FROM ghcr.io/pl4nty/static-web-server:2.24.1

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
