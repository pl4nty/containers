FROM alpine/git:v2.52.0 AS build
WORKDIR /app

RUN git clone -b gh-pages https://github.com/chunliu/vnet-capacity-planner

FROM joseluisq/static-web-server:2.40.1

COPY --from=build /app/vnet-capacity-planner /public

ENV SERVER_PORT=8080
