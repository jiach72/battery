package com.battery.platform.api.dto;

import lombok.Data;

@Data
public class OmSimulationRequest {
    private String energyUnitId;
    private Integer replacePackCount;
    private Integer capacityGradingCount;
}
