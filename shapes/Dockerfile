FROM haskell:8.10.7@sha256:5c365dc081a22550cb4ca62f99a574f8583e8405689aa6a9d89fb21fa13724e9 AS build

# cabal 3.8 only trusts 2 of the keys that sign Hackage's current root.json (threshold 3),
# so bootstrap fails with "root.json does not have enough signatures". Keys from cabal master:
# https://github.com/haskell/cabal/blob/master/cabal-install/src/Distribution/Client/Config.hs
ENV CABAL_CONFIG=/etc/cabal/config
RUN mkdir -p /etc/cabal && printf '%s\n' \
    'repository hackage.haskell.org' \
    '  url: http://hackage.haskell.org/' \
    '  secure: True' \
    '  root-keys: fe331502606802feac15e514d9b9ea83fee8b6ffef71335479a2e68d84adc6b0' \
    '             1ea9ba32c526d1cc91ab5e5bd364ec5e9e8cb67179a471872f6e26f0ae773d42' \
    '             0a5c7ea47cd1b15f01f5f51a33adda7e655bc0f0b0615baa8e271f4c3351e21d' \
    '             51f0161b906011b52c6613376b1ae937670da69322113a246a09f807c62f6921' \
    '             d26e46f3b631aae1433b89379a6c68bd417eb5d1c408f0643dcc07757fece522' \
    '             c7de58fc6a224b92b5b513f26fbb8b370f2d97c7cfe0075a951314a55734be93' \
    '  key-threshold: 3' > $CABAL_CONFIG

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
