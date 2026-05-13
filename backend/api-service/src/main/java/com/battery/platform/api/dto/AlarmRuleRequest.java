package com.battery.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AlarmRuleRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String severity;
    @NotBlank
    private String conditionExpr;
    private String deviceId;
    private String notifyType;
}
