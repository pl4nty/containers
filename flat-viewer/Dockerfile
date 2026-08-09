# vite 2 loads postcss through the "./": "./" exports mapping node dropped in 17:
# Package subpath './lib/node' is not defined by "exports"
FROM node:16.20.2@sha256:f77a1aef2da8d83e45ec990f45df50f1a286c5fe8bbfb8c6e4246c6389705c0b AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .
RUN yarn build

FROM joseluisq/static-web-server:2.44.0@sha256:2c1a7c3e0feaea5859307403b74e1c575f3ec1499094fc077344173d11abaae2

COPY --from=build /app/dist /public

# /:owner/:name is client-side routing, not files on disk
ENV SERVER_FALLBACK_PAGE=/public/index.html
ENV SERVER_PORT=8080
EXPOSE 8080
