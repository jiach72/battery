package com.battery.platform.api.service;

import com.battery.platform.api.dto.ClinicAssessmentDTO;
import com.battery.platform.api.entity.neo4j.AnalogNode;
import com.battery.platform.api.repository.influx.InfluxMeasurementRepository;
import com.battery.platform.api.repository.neo4j.AnalogNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final InfluxMeasurementRepository influxMeasurementRepository;
    private final AnalogNodeRepository analogNodeRepository;

    /**
     * 获取电池单体健康评估列表（真实数据）
     * 从 InfluxDB 查询 SOH/电压/温度，从 Neo4j 查询设备拓扑名称
     */
    public List<ClinicAssessmentDTO> getAssessmentList(Map<String, Object> request) {
        String stationId = Objects.toString(request.get("stationId"), "default");
        try {
            // 1. 从 InfluxDB 查询站点下每个单体的最新量测
            List<Map<String, Object>> influxData = influxMeasurementRepository.queryLatestPerCell(stationId);

            // 2. 从 Neo4j 查询设备拓扑（模拟量映射 → 单体名称）
            Map<String, AnalogNode> analogMap;
            try {
                List<AnalogNode> analogs = analogNodeRepository.findByStationId(stationId);
                analogMap = analogs.stream()
                        .filter(a -> a.getCellId() != null)
                        .collect(Collectors.toMap(AnalogNode::getCellId, a -> a, (a, b) -> a));
            } catch (Exception e) {
                log.warn("Neo4j 设备拓扑查询失败，使用默认名称: {}", e.getMessage());
                analogMap = Collections.emptyMap();
            }

            // 3. 按 cell_id 聚合 InfluxDB 数据
            Map<String, Map<String, Object>> cellDataMap = new LinkedHashMap<>();
            for (Map<String, Object> record : influxData) {
                String cellId = Objects.toString(record.get("cell_id"), null);
                if (cellId == null) continue;
                cellDataMap.computeIfAbsent(cellId, id -> new HashMap<>()).putAll(record);
            }

            // 4. 构建评估列表
            List<ClinicAssessmentDTO> assessments = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);

            for (Map.Entry<String, Map<String, Object>> entry : cellDataMap.entrySet()) {
                String cellId = entry.getKey();
                Map<String, Object> data = entry.getValue();

                double voltage = getDoubleValue(data, "voltage", 0.0);
                double temperature = getDoubleValue(data, "temperature", 0.0);
                double soh = getDoubleValue(data, "soh", 0.0);

                // 从 Neo4j 获取设备名称
                AnalogNode analog = analogMap.get(cellId);
                String deviceName = analog != null && analog.getDescription() != null
                        ? analog.getDescription()
                        : "单体 " + cellId;

                // 计算风险等级
                List<Map<String, String>> risks = new ArrayList<>();

                // SOH 风险
                if (soh > 0) {
                    if (soh < 80) {
                        risks.add(Map.of("type", "soh_risk", "level", "high",
                                "description", "SOH 低于 80%，容量严重衰减"));
                    } else if (soh < 90) {
                        risks.add(Map.of("type", "soh_risk", "level", "medium",
                                "description", "SOH 在 80-90% 之间，容量衰减偏快"));
                    }
                }

                // 温度风险
                if (temperature > 40) {
                    risks.add(Map.of("type", "temp_risk", "level", "high",
                            "description", "温度超过 40°C，存在热失控风险"));
                } else if (temperature > 35) {
                    risks.add(Map.of("type", "temp_risk", "level", "medium",
                            "description", "温度在 35-40°C 之间，温升偏高"));
                }

                // 构建 DTO
                ClinicAssessmentDTO dto = new ClinicAssessmentDTO();
                dto.setDeviceId(cellId);
                dto.setDeviceName(deviceName);
                dto.setLevel("cell");
                dto.setRealSoh(round(soh));
                dto.setTheorySoh(96.0); // 理论 SOH 基准值
                dto.setUsedRecycleTimes(0);
                dto.setRemainingRecycleTimes(2000);
                dto.setBatteryMileageAmount(0.0);
                dto.setBatteryMileageDay(0.0);
                dto.setRisks(risks);
                dto.setConsistencyScore(round(Math.max(0, 100 - Math.abs(voltage - 3.2) * 50 - Math.abs(temperature - 25) * 2)));
                dto.setLastUpdateTime(now.format(DATE_TIME_FORMATTER));

                assessments.add(dto);
            }

            return assessments;
        } catch (Exception e) {
            log.error("查询评估数据失败，stationId={}: {}", stationId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 获取单体端点分析（真实数据）
     * 从 InfluxDB 查询指定单体的时间序列数据
     */
    public Map<String, Object> getEndpointAnalysis(String cellId, String type) {
        Instant stop = Instant.now();
        Instant start = stop.minus(24, ChronoUnit.HOURS);

        // 根据 type 确定查询字段
        String field = switch (type.toLowerCase()) {
            case "voltage" -> "voltage";
            case "temperature" -> "temperature";
            case "capacity" -> "soh";
            default -> type.toLowerCase();
        };

        try {
            List<Map<String, Object>> timeSeries = influxMeasurementRepository
                    .queryCellTimeSeries(cellId, field, start, stop);

            List<String> timeLabels = new ArrayList<>();
            List<Double> dataPoints = new ArrayList<>();

            for (Map<String, Object> record : timeSeries) {
                Object timeObj = record.get("time");
                if (timeObj instanceof Instant instant) {
                    timeLabels.add(LocalDateTime.ofInstant(instant, ZoneId.systemDefault()).format(DATE_TIME_FORMATTER));
                }
                Object value = record.get("value");
                if (value instanceof Number num) {
                    dataPoints.add(round(num.doubleValue()));
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("cellId", cellId);
            result.put("type", type.toUpperCase());
            result.put("timeLabels", timeLabels);
            result.put("dataPoints", dataPoints);
            result.put("dataCount", dataPoints.size());

            // 计算统计摘要
            if (!dataPoints.isEmpty()) {
                double avg = dataPoints.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                double max = dataPoints.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                double min = dataPoints.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                result.put("average", round(avg));
                result.put("max", round(max));
                result.put("min", round(min));
            }

            return result;
        } catch (Exception e) {
            log.error("查询端点分析失败，cellId={}, type={}: {}", cellId, type, e.getMessage(), e);
            return Map.of(
                    "cellId", cellId,
                    "type", type.toUpperCase(),
                    "timeLabels", List.of(),
                    "dataPoints", List.of(),
                    "error", "数据查询失败: " + e.getMessage()
            );
        }
    }

    private double getDoubleValue(Map<String, Object> map, String key, double defaultValue) {
        Object val = map.get(key);
        if (val instanceof Number num) {
            return num.doubleValue();
        }
        if (val instanceof String str) {
            try {
                return Double.parseDouble(str);
            } catch (NumberFormatException ignored) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
