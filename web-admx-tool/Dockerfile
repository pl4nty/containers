FROM node:24.11.1 AS build
WORKDIR /app

# ADD https://github.com/SherlockGn/web-admx-tool.git ./
# COPY *.patch ./
# find . -name *.patch -exec git apply {} ;
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . ./
RUN npm run build

FROM joseluisq/static-web-server:2.38.0
COPY --from=build /app/dist /public
