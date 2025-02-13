FROM --platform=$BUILDPLATFORM golang:1.24-alpine as builder
WORKDIR /build
COPY . .
RUN apk add --update git gcc
ARG TARGETOS TARGETARCH
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH CGO_ENABLED=0 \
  go install -gcflags "-N -l" ./cmd/flares

FROM alpine:latest
RUN apk add --update --no-cache \
  ca-certificates && \
  update-ca-certificates
COPY --from=builder /go/bin/ /usr/local/bin/
WORKDIR /usr/local/bin/
ENTRYPOINT ["flares"]
