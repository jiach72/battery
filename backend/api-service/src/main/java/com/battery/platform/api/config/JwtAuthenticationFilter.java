package com.battery.platform.api.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final StringRedisTemplate redisTemplate;

    private volatile SecretKey cachedKey;

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("jwt.secret 必须配置且长度不少于32字节");
        }
    }

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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                SecretKey key = getKey();
                Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

                if (!"ACCESS".equals(claims.get("type", String.class))) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // 检查token是否已被撤销
                if (isTokenRevoked(claims)) {
                    logger.warn("Token 已被撤销，拒绝访问");
                    filterChain.doFilter(request, response);
                    return;
                }

                String username = claims.get("username", String.class);
                String rolesStr = claims.get("roles", String.class);
                List<SimpleGrantedAuthority> authorities = Stream.of(rolesStr.split(","))
                        .filter(r -> !r.isBlank())
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                        .collect(Collectors.toList());

                var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                // Token 无效，不设置认证信息，让 Spring Security 拒绝请求
                logger.warn("JWT 验证失败: " + e.getMessage(), e);
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * 检查token是否已被撤销（JTI是否在Redis黑名单中）
     */
    private boolean isTokenRevoked(Claims claims) {
        try {
            String jti = claims.getId();
            if (jti == null || jti.isBlank()) {
                jti = claims.getSubject() + ":" + claims.getIssuedAt().getTime();
            }
            String redisKey = "revoked_token:" + jti;
            return Boolean.TRUE.equals(redisTemplate.hasKey(redisKey));
        } catch (Exception e) {
            // Redis不可用时不影响正常认证
            return false;
        }
    }
}
