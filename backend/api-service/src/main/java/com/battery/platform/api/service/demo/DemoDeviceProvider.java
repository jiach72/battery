package com.battery.platform.api.service.demo;

import com.battery.platform.api.entity.neo4j.AnalogNode;
import com.battery.platform.api.entity.neo4j.EnergyUnitNode;
import com.battery.platform.api.entity.neo4j.StationNode;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DemoDeviceProvider {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<StationNode> buildStations() {
        return List.of(
                buildStation("station-north-01", "北区 1 号储能站", "苏州工业园区", 512.0, "online"),
                buildStation("station-east-02", "东区 2 号储能站", "常州武进", 384.0, "online")
        );
    }

    public Map<String, Object> buildTopologyTree(String stationId) {
        List<Map<String, Object>> stations = new ArrayList<>();
        for (StationNode station : buildStations()) {
            if (stationId != null && !stationId.isBlank() && !stationId.equals(station.getId())) {
                continue;
            }
            stations.add(Map.of(
                    "id", station.getId(),
                    "name", station.getName(),
                    "status", station.getStatus(),
                    "energyUnits", buildEnergyUnits(station.getId())
            ));
        }
        return Map.of("stations", stations);
    }

    public List<AnalogNode> buildAnalogs(String stationId) {
        List<AnalogNode> analogs = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            analogs.add(buildAnalog(
                    "analog-" + i,
                    "AI_BMS_" + String.format("%03d", i),
                    "cell-" + i,
                    "单体 " + i + " 电压采样",
                    "V",
                    "voltage"
            ));
        }
        return analogs;
    }

    public Map<String, Object> buildEndpointAnalysis(String cellId, String type) {
        List<Map<String, Object>> curves = new ArrayList<>();
        LocalDateTime start = LocalDateTime.now().minusMinutes(44).withSecond(0).withNano(0);
        for (int i = 0; i < 45; i++) {
            double ratio = i / 44.0;
            curves.add(Map.of(
                    "timestamp", start.plusMinutes(i).format(DATE_TIME_FORMATTER),
                    "voltage", round(3.08 + ratio * 0.26 + Math.sin(i / 6.0) * 0.006),
                    "current", round("CHARGE".equalsIgnoreCase(type) ? 112 - i * 1.1 : -98 + i * 0.8),
                    "soc", round("CHARGE".equalsIgnoreCase(type) ? 42 + ratio * 38 : 78 - ratio * 34),
                    "temperature", round(28.1 + ratio * 4.6 + Math.cos(i / 8.0) * 0.4)
            ));
        }

        return Map.of(
                "cellId", cellId,
                "type", type.toUpperCase(),
                "chargeEndMaxVoltDiff", 0.084,
                "chargeEndVoltSTD", 0.012,
                "chargeEndSOC", 96.3,
                "chargeEndVoltageDeviation", 1.8,
                "cellMaxTemp", 36.7,
                "maxCellTempRange", 4.9,
                "curves", curves
        );
    }

    private StationNode buildStation(String id, String name, String location, Double capacity, String status) {
        StationNode station = new StationNode();
        station.setId(id);
        station.setName(name);
        station.setLocation(location);
        station.setCapacity(capacity);
        station.setStatus(status);
        return station;
    }

    private List<EnergyUnitNode> buildEnergyUnits(String stationId) {
        if ("station-east-02".equals(stationId)) {
            return List.of(
                    buildEnergyUnit("eu-east-01", "东区 2 号站-1 号单元", 192.0),
                    buildEnergyUnit("eu-east-02", "东区 2 号站-2 号单元", 192.0)
            );
        }
        return List.of(
                buildEnergyUnit("eu-1", "北区 1 号站-1 号单元", 256.0),
                buildEnergyUnit("eu-2", "北区 1 号站-2 号单元", 256.0)
        );
    }

    private EnergyUnitNode buildEnergyUnit(String id, String name, Double capacity) {
        EnergyUnitNode energyUnit = new EnergyUnitNode();
        energyUnit.setId(id);
        energyUnit.setName(name);
        energyUnit.setCapacity(capacity);
        return energyUnit;
    }

    private AnalogNode buildAnalog(String id, String analogCode, String cellId, String description, String unit, String dataType) {
        AnalogNode analog = new AnalogNode();
        analog.setId(id);
        analog.setAnalogCode(analogCode);
        analog.setCellId(cellId);
        analog.setDescription(description);
        analog.setUnit(unit);
        analog.setDataType(dataType);
        return analog;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
