FROM node:22.23.3@sha256:363e1587494626837fa7f9a23bdb453d13b0ff3c67c705c2805cfc69c2d2fad7 as build
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

FROM joseluisq/static-web-server:2.38.0

COPY --from=build /app/Resources /public/Resources
COPY --from=build /app/Pages /public/Pages
COPY --from=build /app/Pages/mha.html /public/index.html
