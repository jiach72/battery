package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String refreshToken;
    private Long expiresIn;
    private Object user;
}
