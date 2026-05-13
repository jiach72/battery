package com.battery.platform.api.service.demo;

import com.battery.platform.api.dto.ClinicAssessmentDTO;
import com.battery.platform.api.dto.DashboardOverviewDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DemoDashboardProvider {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public DashboardOverviewDTO buildDashboardOverview(String energyUnitId) {
        DashboardOverviewDTO dto = new DashboardOverviewDTO();
        dto.setTotalCapacity(512.0);
        dto.setTotalSoh(94.6);
        dto.setDailyCharge(128.4);
        dto.setDailyDischarge(121.9);
        dto.setAlarmCount(Map.of("high", 3, "medium", 5, "low", 8));
        dto.setPcsEfficiency(97.3);
        dto.setRevenueToday(82435.0);
        dto.setForecastRevenueMonth(2468000.0);
        dto.setLastUpdateTime(LocalDateTime.now().withSecond(0).withNano(0).format(DATE_TIME_FORMATTER));
        return dto;
    }

    public List<Map<String, Object>> buildRealtimeClusters(String energyUnitId) {
        List<Map<String, Object>> clusters = new ArrayList<>();
        for (int i = 1; i <= 8; i++) {
            double soc = 72.0 - i * 2.8;
            double soh = 96.2 - i * 0.35;
            double voltage = 742.5 - i * 1.7;
            double current = i <= 4 ? 132.0 - i * 3.4 : -96.0 + i * 1.8;
            double temperature = 24.8 + (i % 3) * 1.6 + i * 0.15;

            List<Map<String, Object>> cells = new ArrayList<>();
            for (int cellNo = 1; cellNo <= 12; cellNo++) {
                cells.add(Map.of(
                        "cellNo", cellNo,
                        "voltage", round(3.18 + i * 0.01 + cellNo * 0.002),
                        "current", round(current / 12),
                        "temperature", round(temperature + (cellNo % 4) * 0.3),
                        "soc", round(Math.max(18.0, soc - cellNo * 0.4)),
                        "timestamp", LocalDateTime.now().minusMinutes(cellNo).format(DATE_TIME_FORMATTER)
                ));
            }

            clusters.add(Map.of(
                    "clusterId", "cluster-" + i,
                    "clusterNo", i,
                    "clusterName", "簇 " + i,
                    "voltage", round(voltage),
                    "current", round(current),
                    "temperature", round(temperature),
                    "soc", round(soc),
                    "soh", round(soh),
                    "cells", cells
            ));
        }
        return clusters;
    }

    public Map<String, Object> buildOmSimulation(Map<String, Object> request) {
        int replacePackCount = intValue(request.get("replacePackCount"), 4);
        int capacityGradingCount = intValue(request.get("capacityGradingCount"), 8);
        List<Map<String, Object>> mappings = new ArrayList<>();
        for (int i = 1; i <= Math.min(replacePackCount, 8); i++) {
            mappings.add(Map.of(
                    "targetPosition", "北区1号站-2号单元-簇" + (i + 2) + "-单体" + String.format("%02d", i),
                    "insertCellId", "spare-cell-" + String.format("%02d", i),
                    "beforeSoh", round(90.2 - i * 0.45),
                    "afterSoh", round(94.8 - i * 0.15)
            ));
        }

        return Map.of(
                "planId", "PLAN-DEMO-240421",
                "mappings", mappings,
                "estimatedSohImprovement", round(1.4 + replacePackCount * 0.18),
                "estimatedCost", round(86000 + replacePackCount * 5200 + capacityGradingCount * 380),
                "estimatedDuration", "6.5h",
                "riskLevel", "LOW",
                "recommendation", "建议优先更换簇 4 与簇 7 中高温和高压差单体，并安排一次补充分容。",
                "steps", List.of(
                        "隔离高风险簇并下发检修工单",
                        "执行备品单体入组与均衡校准",
                        "完成二次分容与热管理复核",
                        "恢复并网并持续观测 24 小时"
                )
        );
    }

    public List<ClinicAssessmentDTO> buildAssessments(Map<String, Object> request) {
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        return List.of(
                buildAssessment("cell-01", "北区1号站-2号单元-簇4-单体01", 91.8, 95.1, 684, 1316, 14562.0, 51.2, 82.4, now.minusMinutes(5), List.of(
                        risk("temp_risk", "high", "温升速率异常"),
                        risk("short_circuit_risk", "medium", "疑似微短路特征")
                )),
                buildAssessment("cell-08", "北区1号站-2号单元-簇7-单体08", 89.9, 94.4, 722, 1278, 15211.0, 49.8, 79.6, now.minusMinutes(6), List.of(
                        risk("volt_risk", "high", "末端压差偏大"),
                        risk("capacity_risk", "medium", "容量衰减偏快")
                )),
                buildAssessment("cell-13", "北区1号站-1号单元-簇2-单体13", 93.7, 95.0, 651, 1349, 13982.0, 47.6, 86.1, now.minusMinutes(7), List.of(
                        risk("capacity_risk", "medium", "SOC 漂移偏大")
                )),
                buildAssessment("cell-21", "北区1号站-1号单元-簇1-单体21", 95.4, 96.2, 598, 1402, 13244.0, 45.3, 90.8, now.minusMinutes(9), List.of(
                        risk("temp_risk", "low", "温差轻微偏大")
                )),
                buildAssessment("cell-27", "东区2号站-1号单元-簇3-单体27", 92.5, 94.8, 701, 1299, 14890.0, 52.1, 84.7, now.minusMinutes(11), List.of(
                        risk("liout_risk", "medium", "析锂风险抬升")
                )),
                buildAssessment("cell-34", "东区2号站-2号单元-簇5-单体34", 96.0, 96.5, 542, 1458, 12112.0, 41.9, 92.6, now.minusMinutes(13), List.of(
                        risk("capacity_risk", "low", "容量保持正常")
                )),
                buildAssessment("cell-39", "东区2号站-2号单元-簇6-单体39", 90.7, 94.0, 736, 1264, 15884.0, 54.2, 78.9, now.minusMinutes(16), List.of(
                        risk("temp_risk", "high", "热管理响应迟滞"),
                        risk("volt_risk", "medium", "端电压波动偏大")
                )),
                buildAssessment("cell-44", "东区2号站-2号单元-簇8-单体44", 94.1, 95.2, 617, 1383, 13652.0, 46.1, 88.4, now.minusMinutes(19), List.of(
                        risk("capacity_risk", "medium", "SOC 回差略高")
                )),
                buildAssessment("cell-47", "北区1号站-1号单元-簇3-单体47", 92.9, 94.7, 689, 1311, 14932.0, 50.6, 84.2, now.minusMinutes(22), List.of(
                        risk("short_circuit_risk", "medium", "内阻突增需观察")
                ))
        );
    }

    private ClinicAssessmentDTO buildAssessment(String deviceId, String deviceName, double realSoh, double theorySoh, int usedRecycleTimes,
                                                int remainingRecycleTimes, double batteryMileageAmount, double batteryMileageDay,
                                                double consistencyScore, LocalDateTime lastUpdateTime, List<Map<String, String>> risks) {
        ClinicAssessmentDTO dto = new ClinicAssessmentDTO();
        dto.setDeviceId(deviceId);
        dto.setDeviceName(deviceName);
        dto.setLevel("cell");
        dto.setRealSoh(realSoh);
        dto.setTheorySoh(theorySoh);
        dto.setUsedRecycleTimes(usedRecycleTimes);
        dto.setRemainingRecycleTimes(remainingRecycleTimes);
        dto.setBatteryMileageAmount(batteryMileageAmount);
        dto.setBatteryMileageDay(batteryMileageDay);
        dto.setRisks(risks);
        dto.setConsistencyScore(consistencyScore);
        dto.setLastUpdateTime(lastUpdateTime.format(DATE_TIME_FORMATTER));
        return dto;
    }

    private Map<String, String> risk(String type, String level, String description) {
        return Map.of(
                "type", type,
                "level", level,
                "description", description
        );
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }
}
