package com.battery.platform.api.service;

import com.battery.platform.api.dto.ClinicAssessmentDTO;
import com.battery.platform.api.dto.DashboardOverviewDTO;
import com.battery.platform.api.entity.mysql.AlarmEvent;
import com.battery.platform.api.entity.neo4j.AlarmRuleNode;
import com.battery.platform.api.entity.neo4j.AnalogNode;
import com.battery.platform.api.entity.neo4j.StationNode;
import com.battery.platform.api.service.demo.DemoAlarmProvider;
import com.battery.platform.api.service.demo.DemoDashboardProvider;
import com.battery.platform.api.service.demo.DemoDeviceProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DemoDataService {

    private final DemoDeviceProvider deviceProvider;
    private final DemoAlarmProvider alarmProvider;
    private final DemoDashboardProvider dashboardProvider;

    public DashboardOverviewDTO buildDashboardOverview(String energyUnitId) {
        return dashboardProvider.buildDashboardOverview(energyUnitId);
    }

    public List<Map<String, Object>> buildRealtimeClusters(String energyUnitId) {
        return dashboardProvider.buildRealtimeClusters(energyUnitId);
    }

    public List<AlarmEvent> buildAlarmEvents() {
        return alarmProvider.buildAlarmEvents();
    }

    public List<AlarmRuleNode> buildAlarmRules() {
        return alarmProvider.buildAlarmRules();
    }

    public List<StationNode> buildStations() {
        return deviceProvider.buildStations();
    }

    public Map<String, Object> buildTopologyTree(String stationId) {
        return deviceProvider.buildTopologyTree(stationId);
    }

    public List<AnalogNode> buildAnalogs(String stationId) {
        return deviceProvider.buildAnalogs(stationId);
    }

    public List<ClinicAssessmentDTO> buildAssessments(Map<String, Object> request) {
        return dashboardProvider.buildAssessments(request);
    }

    public Map<String, Object> buildEndpointAnalysis(String cellId, String type) {
        return deviceProvider.buildEndpointAnalysis(cellId, type);
    }

    public Map<String, Object> buildOmSimulation(Map<String, Object> request) {
        return dashboardProvider.buildOmSimulation(request);
    }
}
