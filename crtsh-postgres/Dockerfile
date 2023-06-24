FROM golang:1.20.5 AS cert_validation_success_monitor

WORKDIR /app
COPY go.* ./
RUN go mod download

COPY *.go ./
# can't use Makefile, it references SVN
RUN CGO_ENABLED=0 go build cert_validation_success_monitor.go

# 15 perms are incompatible with setup scripts (public schema)
FROM postgres:13-bullseye AS libx509pq

# build extensions
RUN apt-get update \
&& apt-get install -y --no-install-recommends gcc make postgresql-server-dev-13 \
&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY libx509pq .
RUN make

FROM golang:bullseye AS libzlintpq

RUN apt-get update \
&& apt-get install -y --no-install-recommends postgresql-server-dev-13 \
&& rm -rf /var/lib/apt/lists/*

WORKDIR /libzlintpq
COPY libzlintpq/go.mod libzlintpq/go.sum ./
RUN GO111MODULE=off go get -u gitlab.com/microo8/plgo/plgo
RUN go get -u github.com/zmap/zlint
RUN go mod download

COPY libzlintpq .
RUN sed -i 's/\/home\/rob//' Makefile
RUN make

FROM postgres:13-bullseye

# ingest scripts: wget, ca-certificates
# maintenance scripts: cron
RUN apt-get update \
&& apt-get install -y --no-install-recommends make llvm-11 wget cron \
&& rm -rf /var/lib/apt/lists/*

COPY --from=libx509pq /app/ /libx509pq
RUN cd /libx509pq && make install

COPY --from=libzlintpq /libzlintpq/ /libzlintpq
RUN cd /libzlintpq/build && make install with_llvm=no

# database init
COPY certwatch_db/ .
COPY certwatch_db/sql/create_schema.sql 1-init.sql /docker-entrypoint-initdb.d/
RUN sed -i -e 's/EXTENSION libzlintpq/EXTENSION libzlintpq; CREATE EXTENSION libx509pq/' \
-e 's/\\i fnc\/determine_ca_trust_purposes.fnc//' /docker-entrypoint-initdb.d/create_schema.sql

# TODO add these submodules
RUN sed -i -e 's/\\i libocsppq\/ocsp_embedded.fnc//' \
-e 's/\\i libocsppq\/ocsp_randomserial_embedded.fnc//' \
-e 's/\\i ocsp_responders\/ocsp_responders.fnc//' \
-e 's/\\i ocsp_responders\/ocsp_response.fnc//' \
-e 's/\\i revoked_intermediates\/revoked_intermediates.fnc//' \
-e 's/\\i test_websites\/test_websites.fnc//' /docker-entrypoint-initdb.d/create_schema.sql

# crontab and manual maintenance
COPY certwatch_db/ /root/certwatch/
COPY --from=cert_validation_success_monitor /app/cert_validation_success_monitor /root/certwatch/cert_validation_success_monitor/cert_validation_success_monitor
ENV PGHOST localhost
RUN crontab /root/certwatch/jobs/crontab
