package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class DeviceRequest {
    private String name;
    private String location;
    private Double capacity;
    private String status;
    private String stationId;
    private String unitId;
    private Integer clusterNo;
    private String analogCode;
    private String cellId;
    private String description;
    private String unit;
    private String dataType;
}
