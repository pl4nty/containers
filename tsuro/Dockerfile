FROM gradle:8.14.5-jdk17 AS build
WORKDIR /app

COPY . .
RUN gradle jproRelease --warning-mode all

# Ubuntu with required packages
# https://www.jpro.one/docs/current/2.7/PREPARING_LINUX_FOR_JPRO
FROM eclipse-temurin:17.0.11_9-jre@sha256:b9f5c0acd03eb8275690fe310506f62743a5aaf90e37d165bc0484037a5a9376

# prevent interactive prompt from debconf
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \
&& apt-get update \
&& apt-get -y --no-install-recommends install xorg libasound2 libgtk2.0-0 unzip \
&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build/distributions/app-jpro.zip .
RUN unzip app-jpro.zip -d . && rm app-jpro.zip

CMD './app-jpro/bin/start.sh'
EXPOSE 8080
