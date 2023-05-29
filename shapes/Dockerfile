# based on https://github.com/phadej/docker-haskell-example/blob/master/Dockerfile
FROM haskell:9.4.5 AS build
WORKDIR /app

# required for dynamic build binary location eg ARM
RUN cabal v2-update && cabal v2-install cabal-plan --constraint='cabal-plan ^>=0.5' --constraint='cabal-plan +exe'

# static deps
COPY *.cabal .
RUN cabal v2-build --only-dependencies

# CodeWorld fork
COPY cabal.project .
RUN cabal v2-build --only-dependencies

COPY app app
COPY src src
COPY test test
# couldn't get this to compile statically
# --enable-static --disable-executable-dynamic
RUN cabal v2-build shapes
RUN cp $(cabal-plan list-bin shapes) .

# FROM ubuntu
# WORKDIR /app

# COPY --from=build /app/game .

ENTRYPOINT [ "/app/shapes" ]