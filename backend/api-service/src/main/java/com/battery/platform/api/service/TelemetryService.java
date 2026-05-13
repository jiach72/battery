package com.battery.platform.api.service;

import com.battery.platform.api.dto.TelemetrySchemaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TelemetryService {

    public TelemetrySchemaDTO getSchema() {
        TelemetrySchemaDTO dto = new TelemetrySchemaDTO();
        dto.setSchemaId("telemetry-v1");
        dto.setTopicPattern("battery/{station_id}/{energy_unit_id}/{cluster_id}/{cell_id}");
        dto.setMqttTopics(List.of(
                "battery/station-north-01/eu-1/cluster-4/cell-01",
                "battery/station-east-02/eu-2/cluster-7/cell-08"
        ));
        dto.setKafkaTopics(List.of("bms-raw-data", "alarm", "algorithm-result"));
        dto.setRequiredFields(List.of(
                "tenant_id", "station_id", "energy_unit_id", "cluster_id", "cell_id", "ts", "metrics", "quality"
        ));
        dto.setFieldDefinitions(List.of(
                Map.of("field", "tenant_id", "type", "string", "description", "客户/租户标识"),
                Map.of("field", "station_id", "type", "string", "description", "站点标识"),
                Map.of("field", "energy_unit_id", "type", "string", "description", "储能单元标识"),
                Map.of("field", "cluster_id", "type", "string", "description", "电池簇标识"),
                Map.of("field", "cell_id", "type", "string", "description", "单体标识"),
                Map.of("field", "ts", "type", "datetime", "description", "采样时间戳"),
                Map.of("field", "metrics.voltage", "type", "number", "description", "电压"),
                Map.of("field", "metrics.current", "type", "number", "description", "电流"),
                Map.of("field", "metrics.temperature", "type", "number", "description", "温度"),
                Map.of("field", "metrics.soc", "type", "number", "description", "SOC"),
                Map.of("field", "metrics.soh", "type", "number", "description", "SOH"),
                Map.of("field", "quality.valid", "type", "boolean", "description", "数据有效标志"),
                Map.of("field", "quality.source", "type", "string", "description", "来源网关"),
                Map.of("field", "quality.seq", "type", "number", "description", "单调递增序号")
        ));
        dto.setSamplePayload(Map.of(
                "tenant_id", "cust-a",
                "station_id", "station-001",
                "energy_unit_id", "eu-01",
                "cluster_id", "cluster-04",
                "cell_id", "cell-04-12",
                "ts", "2026-05-12T10:00:00+08:00",
                "metrics", Map.of(
                        "voltage", 3.21,
                        "current", 52.4,
                        "temperature", 28.6,
                        "soc", 82.1,
                        "soh", 94.8
                ),
                "quality", Map.of(
                        "valid", true,
                        "source", "gw-01",
                        "seq", 9912
                )
        ));
        dto.setQualityRules(List.of(
                "时间戳必须统一到秒级或毫秒级",
                "序号必须单调递增，便于去重",
                "异常值要保留原始值和质量标识",
                "断线重连后要补报缺口"
        ));
        return dto;
    }
}
