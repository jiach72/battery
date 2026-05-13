package com.battery.platform.api.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ClinicAssessmentDTO {
    private String deviceId;
    private String deviceName;
    private String level;
    private Double realSoh;
    private Double theorySoh;
    private Integer usedRecycleTimes;
    private Integer remainingRecycleTimes;
    private Double batteryMileageAmount;
    private Double batteryMileageDay;
    private List<Map<String, String>> risks;
    private Double consistencyScore;
    private String lastUpdateTime;
}
