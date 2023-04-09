# https://github.com/jsonwebtoken/jsonwebtoken.github.io
FROM node:19 AS build-env
WORKDIR /app

COPY package*.json .
RUN npm ci

# conflict between webpack 4 and node >= 17: error:0308010C:digital envelope routines::unsupported
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY . .
RUN ./node_modules/.bin/grunt build-website

FROM joseluisq/static-web-server:2.15.0

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
