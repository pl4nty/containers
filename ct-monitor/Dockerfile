FROM golang:1.20.5 AS build

WORKDIR /app
COPY go.* ./
RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 make

FROM scratch
COPY --from=build /app/ct_monitor ./
ENTRYPOINT [ "/ct_monitor" ]
