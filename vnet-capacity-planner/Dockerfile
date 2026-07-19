FROM alpine/git:v2.54.0@sha256:77418e6e7c7f434c4a98eaff04ef16840cf03649c881c03948e3e213923e3136 AS build
WORKDIR /app

RUN git clone -b gh-pages https://github.com/chunliu/vnet-capacity-planner

FROM joseluisq/static-web-server:2.43.0@sha256:6acea6260b14e08dda986361e42640082fbfaab8d88c327de532bb13a3b22994

COPY --from=build /app/vnet-capacity-planner /public

ENV SERVER_PORT=8080
