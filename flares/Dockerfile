FROM --platform=$BUILDPLATFORM golang:1.26-alpine as builder
WORKDIR /build
COPY . .
RUN apk add --update git gcc
ARG TARGETOS TARGETARCH
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH CGO_ENABLED=0 \
  go install -gcflags "-N -l" ./cmd/flares

FROM alpine:latest@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b
RUN apk add --update --no-cache \
  ca-certificates && \
  update-ca-certificates
COPY --from=builder /go/bin/ /usr/local/bin/
WORKDIR /usr/local/bin/
ENTRYPOINT ["flares"]
