FROM ghcr.io/rocker-org/shiny-verse:4.4.2
WORKDIR /srv/shiny-server

RUN rm -r ./*
COPY auto_install_load.R .
RUN Rscript auto_install_load.R
COPY . .
