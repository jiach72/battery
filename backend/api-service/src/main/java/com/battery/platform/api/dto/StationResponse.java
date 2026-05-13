package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class StationResponse {
    private String id;
    private String name;
    private String status;
    private String address;
    private Double capacity;
    private Integer unitCount;
}
