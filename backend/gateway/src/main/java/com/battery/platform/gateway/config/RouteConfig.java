package com.battery.platform.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Value("${gateway.routes.api-service-uri}")
    private String apiServiceUri;

    @Value("${gateway.routes.algorithm-service-uri}")
    private String algorithmServiceUri;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("api-service", r -> r.path("/api/v1/**")
                        .uri(apiServiceUri))
                .route("api-service-websocket", r -> r.path("/ws/**")
                        .uri(apiServiceUri))
                .route("algorithm-service", r -> r.path("/algo/**")
                        .uri(algorithmServiceUri))
                .build();
    }
}
