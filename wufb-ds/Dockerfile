FROM node:24.21.0@sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0 AS build-env
WORKDIR /app

COPY package*.json ./
# lock wasn't updated so npm ci fails
RUN npm install

COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2.44.1@sha256:94618e3d17802265a21926217e6f9e7832b311b6fbf5933684001739fafed06a

COPY --from=build-env /app/dist /public

ENV SERVER_PORT=8080
EXPOSE 8080
