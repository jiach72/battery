package com.battery.platform.api.service;

import com.battery.platform.api.entity.neo4j.RoleNode;
import com.battery.platform.api.entity.neo4j.UserNode;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {

    @Test
    void generateTokenSkipsNullRoleCodes() throws Exception {
        AuthService service = new AuthService(null, null, null);
        setField(service, "jwtSecret", "01234567890123456789012345678901");

        UserNode user = new UserNode();
        user.setId("u-1");
        user.setUsername("admin");
        user.setEnabled(true);

        RoleNode role = new RoleNode();
        role.setName("管理员");
        role.setCode(null);
        user.setRoles(List.of(role));

        Method method = AuthService.class.getDeclaredMethod("generateToken", UserNode.class, String.class, long.class);
        method.setAccessible(true);
        String token = (String) method.invoke(service, user, "ACCESS", 60000L);

        assertTrue(token != null && !token.isBlank());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        var field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
