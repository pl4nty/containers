FROM node:24.17.0@sha256:733e1c06ada118ed9f6133a31aa1290be6929664026fb28821500437c61f2c6f as build
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
