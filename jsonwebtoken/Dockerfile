FROM node:24.18.1@sha256:19cd848a0e073d34bd8cd5545a1b6b4d28489b3e3b607366621ced442bd5f6b4 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

# conflict between webpack 4 and node >= 17: error:0308010C:digital envelope routines::unsupported
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY . .
RUN ./node_modules/.bin/grunt build-website
RUN ./node_modules/.bin/grunt pug:website 

FROM nginx:1.31.3

COPY --from=build /app/dist/website /usr/share/nginx/html
