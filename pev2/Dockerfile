FROM node:20.5.0 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2.20.2
COPY --from=build /app/dist-app /public
