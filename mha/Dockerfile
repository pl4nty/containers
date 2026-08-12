FROM node:24.19.0@sha256:934240a162082fd8b8a2f90cd5114446443f1eba1c5378f6687167ca405e6584 as build
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
