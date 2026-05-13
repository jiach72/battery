package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
    private String refreshToken;
}
