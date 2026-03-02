FROM node:24.14.0 AS build-env
WORKDIR /app

COPY package*.json ./
# lock wasn't updated so npm ci fails
RUN npm install

COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2.41.0

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
