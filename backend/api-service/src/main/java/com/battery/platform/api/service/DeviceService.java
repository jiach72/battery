package com.battery.platform.api.service;

import com.battery.platform.api.config.DemoDataProperties;
import com.battery.platform.api.dto.DeviceResponse;
import com.battery.platform.api.dto.StationResponse;
import com.battery.platform.api.entity.neo4j.*;
import com.battery.platform.api.repository.neo4j.*;
import com.battery.platform.api.repository.redis.RedisOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final StationNodeRepository stationNodeRepository;
    private final EnergyUnitNodeRepository energyUnitNodeRepository;
    private final BatteryClusterNodeRepository batteryClusterNodeRepository;
    private final AnalogNodeRepository analogNodeRepository;
    private final DemoDataService demoDataService;
    private final DemoDataProperties demoDataProperties;
    private final RedisOperationRepository redisOperationRepository;

    public List<StationNode> getStations() {
        try {
            List<StationNode> stations = stationNodeRepository.findAll();
            return stations.isEmpty() && demoDataProperties.isEnabled() ? demoDataService.buildStations() : stations;
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return demoDataService.buildStations();
            }
            throw new IllegalStateException("站点数据访问失败", e);
        }
    }

    public List<StationResponse> getStationsPage(int page, int size) {
        List<StationNode> allStations = getStations();
        int start = page * size;
        int end = Math.min(start + size, allStations.size());
        if (start >= allStations.size()) {
            return List.of();
        }
        List<StationNode> subList = allStations.subList(start, end);
        // 使用批量查询获取unitCount，避免N+1
        List<String> stationIds = subList.stream().map(StationNode::getId).toList();
        Map<String, Long> unitCountMap = countUnitsByStationIds(stationIds);
        return subList.stream().map(s -> toStationResponse(s, unitCountMap.getOrDefault(s.getId(), 0L))).toList();
    }

    public StationNode createStation(StationNode station) {
        if (station.getId() == null || station.getId().isBlank()) {
            station.setId("station-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (station.getStatus() == null) {
            station.setStatus("online");
        }
        try {
            return stationNodeRepository.save(station);
        } catch (Exception e) {
            throw new IllegalStateException("站点创建失败", e);
        }
    }

    public Map<String, Object> getTopologyTree(String stationId) {
        try {
            List<StationNode> stations;
            if (stationId != null && !stationId.isBlank()) {
                stations = stationNodeRepository.findById(stationId)
                        .map(List::of).orElse(List.of());
            } else {
                stations = stationNodeRepository.findAll();
            }
            if (stations.isEmpty()) {
                return demoDataProperties.isEnabled() ? demoDataService.buildTopologyTree(stationId) : Map.of("stations", List.of());
            }
            // 批量查询所有站点的EnergyUnit，避免N+1
            List<String> stationIds = stations.stream().map(StationNode::getId).toList();
            List<EnergyUnitNode> allUnits = energyUnitNodeRepository.findByStationIds(stationIds);
            Map<String, List<EnergyUnitNode>> unitsByStation = allUnits.stream()
                    .filter(u -> u.getStation() != null && u.getStation().getId() != null)
                    .collect(java.util.stream.Collectors.groupingBy(u -> u.getStation().getId()));

            List<Map<String, Object>> stationList = new ArrayList<>();
            for (StationNode station : stations) {
                Map<String, Object> stationMap = new LinkedHashMap<>();
                stationMap.put("id", station.getId());
                stationMap.put("name", station.getName());
                stationMap.put("status", station.getStatus());
                List<EnergyUnitNode> units = unitsByStation.getOrDefault(station.getId(), List.of());
                stationMap.put("energyUnits", units);
                stationList.add(stationMap);
            }
            return Map.of("stations", stationList);
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return demoDataService.buildTopologyTree(stationId);
            }
            throw new IllegalStateException("拓扑数据访问失败", e);
        }
    }

    public EnergyUnitNode createUnit(EnergyUnitNode unit) {
        if (unit.getId() == null || unit.getId().isBlank()) {
            unit.setId("eu-" + UUID.randomUUID().toString().substring(0, 8));
        }
        try {
            return energyUnitNodeRepository.save(unit);
        } catch (Exception e) {
            throw new IllegalStateException("储能单元创建失败", e);
        }
    }

    public BatteryClusterNode createCluster(BatteryClusterNode cluster) {
        if (cluster.getId() == null || cluster.getId().isBlank()) {
            cluster.setId("cluster-" + UUID.randomUUID().toString().substring(0, 8));
        }
        try {
            return batteryClusterNodeRepository.save(cluster);
        } catch (Exception e) {
            throw new IllegalStateException("电池簇创建失败", e);
        }
    }

    public List<AnalogNode> getAnalogs(String stationId) {
        try {
            List<AnalogNode> analogs = analogNodeRepository.findByStationId(stationId);
            return analogs.isEmpty() && demoDataProperties.isEnabled() ? demoDataService.buildAnalogs(stationId) : analogs;
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return demoDataService.buildAnalogs(stationId);
            }
            throw new IllegalStateException("模拟量数据访问失败", e);
        }
    }

    public List<DeviceResponse> getAnalogsDto(String stationId) {
        return getAnalogs(stationId).stream().map(this::toDeviceResponse).toList();
    }

    public AnalogNode updateAnalog(String id, AnalogNode analog) {
        analog.setId(id);
        try {
            AnalogNode saved = analogNodeRepository.save(analog);
            // 更新后清除Redis缓存
            if (saved.getStation() != null && saved.getStation().getId() != null) {
                redisOperationRepository.deleteAnalogMapping(saved.getStation().getId());
            }
            return saved;
        } catch (Exception e) {
            throw new IllegalStateException("模拟量更新失败", e);
        }
    }

    // ========== DTO 转换方法 ==========

    private Map<String, Long> countUnitsByStationIds(List<String> stationIds) {
        if (stationIds.isEmpty()) {
            return Map.of();
        }
        try {
            List<Object[]> results = energyUnitNodeRepository.countByStationIdsRaw(stationIds);
            Map<String, Long> map = new LinkedHashMap<>();
            for (Object[] row : results) {
                String stationId = (String) row[0];
                Long count = (Long) row[1];
                map.put(stationId, count);
            }
            return map;
        } catch (Exception e) {
            // 回退：逐个查询
            Map<String, Long> map = new LinkedHashMap<>();
            for (String id : stationIds) {
                map.put(id, (long) energyUnitNodeRepository.findByStationId(id).size());
            }
            return map;
        }
    }

    private StationResponse toStationResponse(StationNode node, long unitCount) {
        StationResponse resp = new StationResponse();
        resp.setId(node.getId());
        resp.setName(node.getName());
        resp.setStatus(node.getStatus());
        resp.setAddress(node.getLocation());
        resp.setCapacity(node.getCapacity());
        resp.setUnitCount((int) unitCount);
        return resp;
    }

    private DeviceResponse toDeviceResponse(AnalogNode node) {
        DeviceResponse resp = new DeviceResponse();
        resp.setId(node.getId());
        resp.setName(node.getDescription());
        resp.setType("ANALOG");
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("analogCode", node.getAnalogCode());
        props.put("cellId", node.getCellId());
        props.put("unit", node.getUnit());
        props.put("dataType", node.getDataType());
        resp.setProperties(props);
        return resp;
    }
}
