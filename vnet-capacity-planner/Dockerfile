FROM alpine/git:2.36.3 AS build
WORKDIR /app

RUN git clone -b gh-pages https://github.com/chunliu/vnet-capacity-planner

FROM joseluisq/static-web-server:2.17.0

COPY --from=build /app/vnet-capacity-planner /public

ENV SERVER_PORT=8080
ENV SERVER_LOG_LEVEL=info
EXPOSE 8080