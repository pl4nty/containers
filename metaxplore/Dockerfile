FROM ghcr.io/rocker-org/shiny-verse:4.4.2
WORKDIR /srv/shiny-server

RUN rm -r ./* && sudo apt-get update && sudo apt-get install -y libglpk-dev
COPY auto_install_load.R .
RUN Rscript auto_install_load.R
COPY . .
