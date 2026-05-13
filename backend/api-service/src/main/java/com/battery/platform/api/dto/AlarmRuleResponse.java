package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class AlarmRuleResponse {
    private String id;
    private String name;
    private String severity;
    private String conditionExpr;
    private Boolean enabled;
    private String deviceId;
    private String notifyType;
}
