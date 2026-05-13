# ── Multi-stage build: Maven build + JRE runtime ──
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY api-service/pom.xml api-service/
COPY gateway/pom.xml gateway/
RUN mvn -B dependency:go-offline -pl gateway -am
COPY . .
RUN mvn -B -pl gateway -am package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /build/gateway/target/*.jar app.jar
RUN chown -R app:app /app
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
