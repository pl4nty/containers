# https://github.com/microsoftgraph/windowsupdates-webapplication-sample
FROM node:18 AS build-env
WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2.15.0

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
