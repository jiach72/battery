package com.battery.platform.api.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${websocket.allowed-origins:}")
    private String allowedOrigins;

    private volatile SecretKey cachedKey;

    private SecretKey getKey() {
        SecretKey key = cachedKey;
        if (key == null) {
            synchronized (this) {
                key = cachedKey;
                if (key == null) {
                    key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                    cachedKey = key;
                }
            }
        }
        return key;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!isAllowedOrigin(request)) {
            response.setStatusCode(HttpStatus.FORBIDDEN);
            return false;
        }

        String token = UriComponentsBuilder.fromUri(request.getURI())
                .build()
                .getQueryParams()
                .getFirst("token");
        if (token == null || token.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            SecretKey key = getKey();
            var claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!"ACCESS".equals(claims.get("type", String.class))) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }
            attributes.put("userId", claims.getSubject());
            attributes.put("roles", claims.get("roles", String.class));
            return true;
        } catch (Exception e) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No-op.
    }

    private boolean isAllowedOrigin(ServerHttpRequest request) {
        String origin = request.getHeaders().getOrigin();
        List<String> configuredOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
        if (configuredOrigins.isEmpty()) {
            return true;
        }
        if (origin == null || origin.isBlank()) {
            return false;
        }
        return configuredOrigins.contains(origin);
    }
}
