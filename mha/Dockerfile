FROM node:22.19.0@sha256:afff6d8c97964a438d2e6a9c96509367e45d8bf93f790ad561a1eaea926303d9 as build
WORKDIR /app

# puppeteer dependency can't install ARM chromium by default
# puppeteer/puppeteer#7740
RUN apt-get update
RUN apt-get install -y chromium && apt-get clean
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --if-present

FROM joseluisq/static-web-server:2.38.0@sha256:acfb7d76452f9746c5d2f8d791c9b659ac277b2b63fcac3ad97276fcdc969ffc

COPY --from=build /app/Resources /public/Resources
COPY --from=build /app/Pages /public/Pages
COPY --from=build /app/Pages/mha.html /public/index.html
