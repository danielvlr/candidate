# Use uma imagem base oficial do OpenJDK
FROM alpine/java:22-jdk

# Cria um diretório para a aplicação
VOLUME /tmp

# Define o argumento para o JAR_FILE
ARG JAR_FILE=target/*.jar

# Copia o JAR do Spring Boot para o diretório do contêiner
COPY ${JAR_FILE} app.jar

# Expõe a porta em que a aplicação vai rodar
EXPOSE 8080

# Comando para executar a aplicação
ENTRYPOINT ["java","-jar","/app.jar"]
