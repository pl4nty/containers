FROM node:24.19.0@sha256:4196d66a565c6f195728d9952f161f4adfe2ad753052a08b7ec7f1c5a6bda42b AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

# conflict between webpack 4 and node >= 17: error:0308010C:digital envelope routines::unsupported
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY . .
RUN ./node_modules/.bin/grunt build-website
RUN ./node_modules/.bin/grunt pug:website 

FROM nginx:1.31.3@sha256:8541484afbc9c8a5a8a99b379568ebbc957f658583ec9448fc43104229c03cf8

COPY --from=build /app/dist/website /usr/share/nginx/html
