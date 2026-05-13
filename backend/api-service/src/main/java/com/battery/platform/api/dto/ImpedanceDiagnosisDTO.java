package com.battery.platform.api.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ImpedanceDiagnosisDTO {
    private String deviceId;
    private String deviceName;
    private String diagnosisLevel;
    private Double score;
    private String method;
    private String conclusion;
    private String riskLevel;
    private List<Map<String, Object>> features;
    private List<String> recommendations;
}
