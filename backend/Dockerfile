FROM eclipse-temurin:21-jdk-jammy AS build
ENV HOME=/usr/app
RUN mkdir -p $HOME
WORKDIR $HOME
ADD . $HOME
RUN chmod +x mvnw
RUN ./mvnw -f $HOME/pom.xml clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
ARG JAR_FILE=/usr/app/target/*.jar
COPY --from=build $JAR_FILE /app/runner.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=render
ENTRYPOINT java -jar /app/runner.jar