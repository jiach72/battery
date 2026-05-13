package com.battery.platform.api.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class OmSimulationResult {
    private Double estimatedCost;
    private Double estimatedSohImprovement;
    private List<Map<String, Object>> mappings;
    private String estimatedDuration;
    private String riskLevel;
    private String recommendation;
    private List<String> steps;

    // Backward-compatible aliases for older callers.
    private Double totalCost;
    private Double sohImprovement;
    private List<Map<String, Object>> swapInstructions;
}
