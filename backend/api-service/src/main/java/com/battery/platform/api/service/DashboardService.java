package com.battery.platform.api.service;

import com.battery.platform.api.dto.DashboardOverviewDTO;
import com.battery.platform.api.repository.influx.InfluxMeasurementRepository;
import com.battery.platform.api.repository.mysql.AlarmEventRepository;
import com.battery.platform.api.repository.neo4j.EnergyUnitNodeRepository;
import com.battery.platform.api.repository.redis.RedisOperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final InfluxMeasurementRepository influxMeasurementRepository;
    private final RedisOperationRepository redisOperationRepository;
    private final EnergyUnitNodeRepository energyUnitNodeRepository;
    private final AlarmEventRepository alarmEventRepository;
    private final DemoDataService demoDataService;

    public DashboardOverviewDTO getOverview(String energyUnitId) {
        // 1. 尝试从 Redis 缓存获取
        String cacheKey = "dashboard_overview:" + energyUnitId;
        DashboardOverviewDTO cached = redisOperationRepository.getDashboardOverview(cacheKey);
        if (cached != null) {
            return cached;
        }

        DashboardOverviewDTO dto = demoDataService.buildDashboardOverview(energyUnitId);
        try {
            // 从 InfluxDB 查询最新量测数据
            List<Map<String, Object>> latestData = influxMeasurementRepository
                    .queryLatestMeasurements("default", energyUnitId, 100);

            double totalCapacity = 0.0;
            double totalSoh = 0.0;
            double dailyCharge = 0.0;
            double dailyDischarge = 0.0;
            int measureCount = 0;

            for (Map<String, Object> record : latestData) {
                String field = (String) record.getOrDefault("field", "");
                Object value = record.get("value");
                if (value == null) continue;
                double numVal = value instanceof Number ? ((Number) value).doubleValue() : 0;
                switch (field) {
                    case "capacity" -> { totalCapacity += numVal; measureCount++; }
                    case "soh" -> totalSoh += numVal;
                    case "charge_kwh" -> dailyCharge += numVal;
                    case "discharge_kwh" -> dailyDischarge += numVal;
                }
            }
            dto.setTotalCapacity(measureCount > 0 ? Math.round(totalCapacity * 100.0) / 100.0 : 500.0);
            dto.setTotalSoh(measureCount > 0 ? Math.round(totalSoh / Math.max(1, measureCount) * 100.0) / 100.0 : 92.5);
            dto.setDailyCharge(dailyCharge > 0 ? dailyCharge : dto.getDailyCharge());
            dto.setDailyDischarge(dailyDischarge > 0 ? dailyDischarge : dto.getDailyDischarge());
        } catch (Exception e) {
            log.warn("InfluxDB 查询失败，使用演示值: {}", e.getMessage());
        }

        // 从 MySQL 查询告警统计
        long highAlarms = 0, mediumAlarms = 0, lowAlarms = 0;
        try {
            highAlarms = alarmEventRepository.countBySeverityAndStatus("HIGH", "UNACK");
            mediumAlarms = alarmEventRepository.countBySeverityAndStatus("MEDIUM", "UNACK");
            lowAlarms = alarmEventRepository.countBySeverityAndStatus("LOW", "UNACK");
        } catch (Exception e) {
            log.warn("告警统计查询失败: {}", e.getMessage());
        }
        if (highAlarms + mediumAlarms + lowAlarms > 0) {
            dto.setAlarmCount(Map.of("high", (int) highAlarms, "medium", (int) mediumAlarms, "low", (int) lowAlarms));
        }

        dto.setRevenueToday(Math.round(dto.getDailyDischarge() * 0.85 * 100.0) / 100.0);
        dto.setForecastRevenueMonth(Math.round(dto.getRevenueToday() * 30 * 100.0) / 100.0);

        // 设置数据更新时间
        dto.setDataAsOf(LocalDateTime.now());

        // 写入 Redis 缓存，TTL 30 秒
        redisOperationRepository.setDashboardOverview(cacheKey, dto, 30);

        return dto;
    }

    public List<Map<String, Object>> getRealtimeClusters(String energyUnitId) {
        List<Map<String, Object>> clusters = new ArrayList<>(demoDataService.buildRealtimeClusters(energyUnitId));
        try {
            // 优先从 Redis rt_measure: 缓存读取实时数据
            Map<Object, Object> rtData = redisOperationRepository.getRealtimeMeasure("default", energyUnitId);
            if (rtData != null && !rtData.isEmpty()) {
                clusters.clear();
                // 解析 Redis 中的实时量测数据
                Map<String, Map<String, Object>> clusterMap = new LinkedHashMap<>();
                rtData.forEach((k, v) -> {
                    String key = k.toString();
                    // key 格式: clusterId:field
                    String[] parts = key.split(":", 2);
                    if (parts.length == 2) {
                        clusterMap.computeIfAbsent(parts[0], id -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("clusterId", id);
                            return m;
                        }).put(parts[1], v);
                    }
                });
                clusters.addAll(clusterMap.values());
            }
        } catch (Exception e) {
            log.warn("Redis 实时数据查询失败: {}", e.getMessage());
        }

        // Redis 无数据时从 InfluxDB 查询最新量测
        if (clusters.isEmpty()) {
            try {
                List<Map<String, Object>> influxData = influxMeasurementRepository
                        .queryLatestMeasurements("default", energyUnitId, 100);
                clusters.clear();
                Map<String, Map<String, Object>> clusterMap = new LinkedHashMap<>();
                for (Map<String, Object> record : influxData) {
                    String clusterId = (String) record.getOrDefault("cluster_id", "CL-1");
                    clusterMap.computeIfAbsent(clusterId, id -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("clusterId", id);
                        return m;
                    }).put(String.valueOf(record.get("field")), record.get("value"));
                }
                clusters.addAll(clusterMap.values());
            } catch (Exception e) {
                log.warn("InfluxDB 实时数据查询失败，使用默认值: {}", e.getMessage());
            }
        }
        return clusters;
    }
}
