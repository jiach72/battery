package com.battery.platform.api.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ClinicAssessmentResponse {
    private String deviceId;
    private String deviceName;
    private Double soh;
    private Double capacity;
    private String riskLevel;
    private Map<String, String> riskDetails;
    private LocalDateTime assessedAt;
}
