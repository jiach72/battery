package com.battery.platform.api.service;

import com.battery.platform.api.dto.LoginResponse;
import com.battery.platform.api.entity.neo4j.UserNode;
import com.battery.platform.api.repository.neo4j.UserNodeRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserNodeRepository userNodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Value("${auth.demo.enabled:false}")
    private boolean demoEnabled;

    @Value("${auth.demo.username:}")
    private String demoUsername;

    @Value("${auth.demo.password:}")
    private String demoPassword;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long jwtRefreshExpiration;

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

    public LoginResponse login(String username, String password) {
        UserNode user;
        try {
            Optional<UserNode> userOpt = userNodeRepository.findByUsername(username);
            if (userOpt.isPresent()) {
                user = userOpt.get();
                if (!user.getEnabled()) {
                    throw new IllegalArgumentException("用户已被禁用");
                }
                if (!passwordEncoder.matches(password, user.getPassword())) {
                    throw new IllegalArgumentException("用户名或密码错误");
                }
            } else {
                user = buildDemoUserIfEnabled(username, password);
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (EmptyResultDataAccessException | NoSuchElementException e) {
            user = buildDemoUserIfEnabled(username, password);
        }
        String token = generateToken(user, "ACCESS", jwtExpiration);
        String refreshToken = generateToken(user, "REFRESH", jwtRefreshExpiration);
        List<String> roles = user.getRoles() != null
                ? user.getRoles().stream().map(r -> r.getCode() != null ? r.getCode() : r.getName()).filter(Objects::nonNull).toList()
                : List.of();
        List<String> permissions = user.getRoles() != null
                ? user.getRoles().stream()
                .filter(Objects::nonNull)
                .flatMap(role -> role.getMenus() != null ? role.getMenus().stream() : java.util.stream.Stream.empty())
                .map(menu -> menu.getPath() != null ? menu.getPath() : menu.getName())
                .filter(Objects::nonNull)
                .distinct()
                .toList()
                : List.of();
        Map<String, Object> userInfo = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                "roles", roles,
                "permissions", permissions
        );
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtExpiration);
        response.setUser(userInfo);
        return response;
    }

    public LoginResponse refresh(String refreshToken) {
        try {
            // 检查refresh token是否已被撤销
            if (isTokenRevoked(refreshToken)) {
                throw new IllegalArgumentException("刷新令牌已被撤销");
            }
            SecretKey key = getKey();
            var claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(refreshToken).getPayload();
            String tokenType = claims.get("type", String.class);
            if (!"REFRESH".equals(tokenType)) {
                throw new IllegalArgumentException("无效的刷新令牌类型");
            }
            String username = claims.get("username", String.class);
            UserNode user = userNodeRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
            String newToken = generateToken(user, "ACCESS", jwtExpiration);
            LoginResponse response = new LoginResponse();
            response.setToken(newToken);
            response.setExpiresIn(jwtExpiration);
            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("无效的刷新令牌");
        }
    }

    /**
     * 登出：撤销当前token
     */
    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            revokeToken(token.substring(7));
        }
    }

    /**
     * 撤销token，将JTI存入Redis，TTL与token剩余有效期一致
     */
    public void revokeToken(String token) {
        try {
            SecretKey key = getKey();
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            // 使用token的JTI作为撤销标识，若无JTI则使用subject+issuedAt组合
            String jti = claims.getId();
            if (jti == null || jti.isBlank()) {
                jti = claims.getSubject() + ":" + claims.getIssuedAt().getTime();
            }
            Date expiration = claims.getExpiration();
            long ttlMs = expiration.getTime() - System.currentTimeMillis();
            if (ttlMs > 0) {
                String redisKey = "revoked_token:" + jti;
                redisTemplate.opsForValue().set(redisKey, "1", ttlMs, TimeUnit.MILLISECONDS);
            }
        } catch (Exception e) {
            // token解析失败时忽略，不阻塞登出流程
        }
    }

    /**
     * 检查token是否已被撤销
     */
    public boolean isTokenRevoked(String token) {
        try {
            SecretKey key = getKey();
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            String jti = claims.getId();
            if (jti == null || jti.isBlank()) {
                jti = claims.getSubject() + ":" + claims.getIssuedAt().getTime();
            }
            String redisKey = "revoked_token:" + jti;
            return Boolean.TRUE.equals(redisTemplate.hasKey(redisKey));
        } catch (Exception e) {
            return false;
        }
    }

    private String generateToken(UserNode user, String type, long expiration) {
        SecretKey key = getKey();
        String roles = user.getRoles() != null
                ? String.join(",", user.getRoles().stream()
                .map(r -> r.getCode() != null ? r.getCode() : r.getName())
                .filter(Objects::nonNull)
                .toList())
                : "";
        return Jwts.builder()
                .subject(user.getId())
                .id(UUID.randomUUID().toString())
                .claim("username", user.getUsername())
                .claim("roles", roles)
                .claim("type", type)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    private UserNode buildDemoUserIfEnabled(String username, String password) {
        if (!demoEnabled || demoUsername == null || demoUsername.isBlank() || demoPassword == null || demoPassword.isBlank()) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        if (!demoUsername.equals(username) || !demoPassword.equals(password)) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        UserNode user = new UserNode();
        user.setId("demo-user-admin");
        user.setUsername(demoUsername);
        user.setDisplayName("演示管理员");
        user.setEnabled(true);

        var role = new com.battery.platform.api.entity.neo4j.RoleNode();
        role.setId("role-admin");
        role.setName("管理员");
        role.setCode("admin");

        var dashboardMenu = new com.battery.platform.api.entity.neo4j.MenuNode();
        dashboardMenu.setId("menu-dashboard");
        dashboardMenu.setName("驾驶舱");
        dashboardMenu.setPath("/dashboard");

        var alarmMenu = new com.battery.platform.api.entity.neo4j.MenuNode();
        alarmMenu.setId("menu-alarm");
        alarmMenu.setName("告警中心");
        alarmMenu.setPath("/alarm");

        var clinicMenu = new com.battery.platform.api.entity.neo4j.MenuNode();
        clinicMenu.setId("menu-clinic");
        clinicMenu.setName("问诊室");
        clinicMenu.setPath("/clinic/overview");

        role.setMenus(List.of(dashboardMenu, alarmMenu, clinicMenu));
        user.setRoles(List.of(role));
        return user;
    }
}
