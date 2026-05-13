package com.battery.platform.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AlarmEventResponse {
    private Long id;
    private String deviceId;
    private String severity;
    private String message;
    private String status;
    private LocalDateTime createdAt;
}
