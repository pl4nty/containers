FROM node:24.19.0@sha256:4196d66a565c6f195728d9952f161f4adfe2ad753052a08b7ec7f1c5a6bda42b AS build-env
WORKDIR /app

COPY package*.json ./
# lock wasn't updated so npm ci fails
RUN npm install

COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2.43.0@sha256:6acea6260b14e08dda986361e42640082fbfaab8d88c327de532bb13a3b22994

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
