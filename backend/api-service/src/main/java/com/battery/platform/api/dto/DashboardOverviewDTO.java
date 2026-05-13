package com.battery.platform.api.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class DashboardOverviewDTO {
    private Double totalCapacity;
    private Double totalSoh;
    private Double dailyCharge;
    private Double dailyDischarge;
    private Map<String, Integer> alarmCount;
    private Double pcsEfficiency;
    private Double revenueToday;
    private Double forecastRevenueMonth;
    private String lastUpdateTime;
    private LocalDateTime dataAsOf; // 数据更新时间戳
}
