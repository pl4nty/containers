FROM alpine/git:v2.43.0 AS build
WORKDIR /app

RUN git clone -b gh-pages https://github.com/chunliu/vnet-capacity-planner

FROM joseluisq/static-web-server:2.28.0

COPY --from=build /app/vnet-capacity-planner /public

ENV SERVER_PORT=8080
