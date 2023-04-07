FROM node:18 as build
WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build --if-present

FROM joseluisq/static-web-server:2

COPY --from=build /app/Resources /public/Resources
COPY --from=build /app/Pages /public/Pages
COPY --from=build /app/Pages/mha.html /public/index.html
