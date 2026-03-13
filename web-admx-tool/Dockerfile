FROM node:24.14.0 AS build
WORKDIR /app

# ADD https://github.com/SherlockGn/web-admx-tool.git ./
# COPY *.patch ./
# find . -name *.patch -exec git apply {} ;
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.npm pnpm ci
RUN apt-get update && apt-get install -y p7zip-full
COPY . ./
RUN npm run build

FROM joseluisq/static-web-server:2.41.0
COPY --from=build /app/dist /public
