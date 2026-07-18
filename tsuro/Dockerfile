FROM gradle:8.14.5-jdk17 AS build
WORKDIR /app

COPY . .
RUN gradle jproRelease --warning-mode all

# Ubuntu with required packages
# https://www.jpro.one/docs/current/2.7/PREPARING_LINUX_FOR_JPRO
FROM eclipse-temurin:17.0.18_8-jre@sha256:07c1f0f0c3f3c714cea7a9250a8418ec329baa2cea1f77dcda2a7332ff937633

# prevent interactive prompt from debconf
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \
&& apt-get update \
&& apt-get -y --no-install-recommends install xorg libasound2 libgtk2.0-0 unzip \
&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build/distributions/app-jpro.zip .
RUN unzip app-jpro.zip -d . && rm app-jpro.zip

CMD './app-jpro/bin/start.sh'
EXPOSE 8080
