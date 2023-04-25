FROM eclipse-temurin:17-jdk AS build

COPY . .
RUN chmod +x gradlew && ./gradlew jproRelease --warning-mode all

# Ubuntu with required packages
# https://www.jpro.one/docs/current/2.7/PREPARING_LINUX_FOR_JPRO
FROM eclipse-temurin:17-jre
RUN apt-get update
# prevent interactive prompt from debconf
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
RUN apt-get -y install xorg libasound2 libgtk2.0-0 unzip
# gtk2-engines 

COPY --from=build build/distributions/tsuro-jpro.zip .
RUN unzip tsuro-jpro.zip -d /app

WORKDIR /app/tsuro-jpro/bin
RUN sed -i 's/nohup //g' start.sh && sed -i 's/t &/t/g' start.sh

CMD './restart.sh'
EXPOSE 80
