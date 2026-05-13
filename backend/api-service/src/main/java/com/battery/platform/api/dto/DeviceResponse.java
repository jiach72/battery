package com.battery.platform.api.dto;

import lombok.Data;

import java.util.Map;

@Data
public class DeviceResponse {
    private String id;
    private String name;
    private String status;
    private String type;
    private Map<String, Object> properties;
}
