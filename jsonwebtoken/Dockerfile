FROM node:19 AS build-env
WORKDIR /app

COPY package*.json .
RUN npm ci

# conflict between webpack 4 and node >= 17: error:0308010C:digital envelope routines::unsupported
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY . .
RUN ./node_modules/.bin/grunt build-website
RUN ./node_modules/.bin/grunt pug:website 

FROM ghcr.io/pl4nty/static-web-server:latest

COPY --from=build-env /app/dist/website /public

ENV SERVER_PORT=8080
EXPOSE 8080
