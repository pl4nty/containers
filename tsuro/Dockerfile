FROM gradle:9.6.0-jdk17@sha256:e9f58500306b743df32ebb2729bb9d96e1853547a155f1f4d759d3118c2fc47a AS build
WORKDIR /app

COPY . .
RUN gradle jproRelease --warning-mode all

# Ubuntu with required packages
# https://www.jpro.one/docs/current/2.7/PREPARING_LINUX_FOR_JPRO
FROM eclipse-temurin:17.0.11_9-jre

# prevent interactive prompt from debconf
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \
&& apt-get update \
&& apt-get -y --no-install-recommends install xorg libasound2 libgtk2.0-0 unzip \
&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build/distributions/app-jpro.zip .
RUN unzip app-jpro.zip -d . && rm app-jpro.zip

CMD './app-jpro/bin/start.sh'
EXPOSE 8080
