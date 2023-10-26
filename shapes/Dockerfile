FROM haskell:9.8.1 AS build

RUN --mount=type=cache,target=/root/.cabal \
    cabal v2-update
  
COPY *.cabal .
RUN --mount=type=cache,target=/root/.cabal \
    cabal v2-build --only-dependencies
    
COPY . .
RUN --mount=type=cache,target=/root/.cabal \
    cabal v2-build && \
    cp -r /root/.cabal /tmp
RUN mv /tmp/.cabal /root

ENTRYPOINT [ "cabal", "v2-run" ]
