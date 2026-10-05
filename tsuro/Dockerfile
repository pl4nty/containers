FROM gradle:9.7.1-jdk17@sha256:b0405bbcff65a32f4acc253cf6ba9c70b5c1553c80128fe6051cc6945e0e5529 AS build
WORKDIR /app

COPY . .
RUN gradle jproRelease --warning-mode all

# Ubuntu with required packages
# https://www.jpro.one/docs/current/2.7/PREPARING_LINUX_FOR_JPRO
FROM eclipse-temurin:17.0.20.1_1-jre-noble@sha256:d1b6f76d8112c41f1068597741f0c0bda36d323365078e685381f72e5ec51ca0

# prevent interactive prompt from debconf
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \
&& apt-get update \
&& apt-get -y --no-install-recommends install xorg libasound2t64 libgtk2.0-0t64 unzip \
&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build/distributions/app-jpro.zip .
RUN unzip app-jpro.zip -d . && rm app-jpro.zip

CMD './app-jpro/bin/start.sh'
EXPOSE 8080
