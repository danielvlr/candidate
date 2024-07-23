FROM eclipse-temurin:22-jdk-jammy AS build
WORKDIR /opt/app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY ./src ./src
RUN ./mvnw clean install -DskipTests

FROM alpine/java:22-jdk
WORKDIR /opt/app
EXPOSE 8080
COPY --from=build /opt/app/target/*.jar /opt/app/app.jar
ENTRYPOINT ["java","-jar","/opt/app/app.jar"]
