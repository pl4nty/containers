FROM node:22.16.0 AS build
WORKDIR /app

# ADD https://github.com/SherlockGn/web-admx-tool.git ./
# COPY *.patch ./
# find . -name *.patch -exec git apply {} ;
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . ./
RUN npm run build

FROM joseluisq/static-web-server:2.37.0
COPY --from=build /app/dist /public
