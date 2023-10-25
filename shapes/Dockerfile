# based on https://github.com/phadej/docker-haskell-example/blob/master/Dockerfile
FROM haskell:8.10.7 AS build

WORKDIR /app

RUN --mount=type=cache,target=/root/.cabal \
    cabal v2-update
  
COPY *.cabal .
RUN --mount=type=cache,target=/root/.cabal \
    cabal v2-build --only-dependencies

ENTRYPOINT [ "cabal", "v2-run" ]
