FROM node:24.21.0@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4 AS build
WORKDIR /app

COPY package.json yarn.lock ./
# tailwind 2.1 does require("postcss/lib/node"), which the locked postcss 8.2.8 only exposes
# through the "./": "./" exports folder mapping that node dropped in 17:
# Package subpath './lib/node' is not defined by "exports"
# Dedupe postcss@^8 onto the 8.4.5 already in the lockfile, which exports ./lib/node explicitly.
RUN npx --yes yarn-deduplicate@6.0.2 --packages postcss --strategy highest yarn.lock
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .
RUN yarn build

FROM joseluisq/static-web-server:2.44.0@sha256:2c1a7c3e0feaea5859307403b74e1c575f3ec1499094fc077344173d11abaae2

COPY --from=build /app/dist /public

# /:owner/:name is client-side routing, not files on disk
ENV SERVER_FALLBACK_PAGE=/public/index.html
ENV SERVER_PORT=8080
EXPOSE 8080
