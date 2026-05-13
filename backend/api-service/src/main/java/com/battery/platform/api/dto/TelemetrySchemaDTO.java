package com.battery.platform.api.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TelemetrySchemaDTO {
    private String schemaId;
    private String topicPattern;
    private List<String> mqttTopics;
    private List<String> kafkaTopics;
    private List<String> requiredFields;
    private List<Map<String, String>> fieldDefinitions;
    private Map<String, Object> samplePayload;
    private List<String> qualityRules;
}
