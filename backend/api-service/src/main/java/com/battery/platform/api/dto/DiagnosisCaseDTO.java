package com.battery.platform.api.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class DiagnosisCaseDTO {
    private String caseId;
    private String deviceId;
    private String deviceName;
    private String diagnosisType;
    private String conclusion;
    private String riskLevel;
    private Double confidence;
    private String detectedAt;
    private List<Map<String, Object>> evidence;
    private List<String> recommendations;
}
