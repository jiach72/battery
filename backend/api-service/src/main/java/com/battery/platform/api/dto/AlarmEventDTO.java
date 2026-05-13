package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class AlarmEventDTO {
    private String id;
    private String deviceId;
    private String deviceName;
    private String severity;
    private String alarmType;
    private String message;
    private String status;
    private String triggeredAt;
    private String acknowledgedAt;
    private String acknowledgedBy;
}
