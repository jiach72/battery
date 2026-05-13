# ── Multi-stage build: Maven build + JRE runtime ──
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY api-service/pom.xml api-service/
COPY gateway/pom.xml gateway/
RUN mvn -B dependency:go-offline -pl api-service -am
COPY . .
RUN mvn -B -pl api-service -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/api-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
