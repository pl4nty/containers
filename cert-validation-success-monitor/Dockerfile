FROM golang:1.20.5 AS build

WORKDIR /app
COPY go.* ./
RUN go mod download

COPY *.go ./
# can't use Makefile, it references SVN
RUN CGO_ENABLED=0 go build cert_validation_success_monitor.go

FROM scratch
COPY --from=build /app/cert_validation_success_monitor ./
ENTRYPOINT [ "/cert_validation_success_monitor" ]
