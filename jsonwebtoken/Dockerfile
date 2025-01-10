FROM node:22.13.0 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

# conflict between webpack 4 and node >= 17: error:0308010C:digital envelope routines::unsupported
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY . .
RUN ./node_modules/.bin/grunt build-website
RUN ./node_modules/.bin/grunt pug:website 

FROM nginx:1.27.3

COPY --from=build /app/dist/website /usr/share/nginx/html
