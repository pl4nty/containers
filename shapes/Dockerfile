FROM haskell:8.10.7@sha256:5c365dc081a22550cb4ca62f99a574f8583e8405689aa6a9d89fb21fa13724e9 AS build

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
