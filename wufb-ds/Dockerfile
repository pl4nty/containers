FROM node:24.17.0@sha256:733e1c06ada118ed9f6133a31aa1290be6929664026fb28821500437c61f2c6f AS build-env
WORKDIR /app

COPY package*.json ./
# lock wasn't updated so npm ci fails
RUN npm install

COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2.43.0@sha256:6acea6260b14e08dda986361e42640082fbfaab8d88c327de532bb13a3b22994

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
