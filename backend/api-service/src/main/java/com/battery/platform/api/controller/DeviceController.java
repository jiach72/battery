package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.dto.DeviceRequest;
import com.battery.platform.api.dto.PageResponse;
import com.battery.platform.api.dto.StationResponse;
import com.battery.platform.api.dto.DeviceResponse;
import com.battery.platform.api.entity.neo4j.*;
import com.battery.platform.api.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping("/stations")
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<ApiResponse<List<StationResponse>>> getStations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(deviceService.getStationsPage(page, size)));
    }

    @PostMapping("/stations")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<ApiResponse<StationNode>> createStation(@RequestBody DeviceRequest request) {
        StationNode station = new StationNode();
        station.setName(request.getName());
        station.setLocation(request.getLocation());
        station.setCapacity(request.getCapacity());
        station.setStatus(request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok(deviceService.createStation(station)));
    }

    @GetMapping("/tree")
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopologyTree(
            @RequestParam String stationId) {
        return ResponseEntity.ok(ApiResponse.ok(deviceService.getTopologyTree(stationId)));
    }

    @PostMapping("/units")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<ApiResponse<EnergyUnitNode>> createUnit(@RequestBody DeviceRequest request) {
        EnergyUnitNode unit = new EnergyUnitNode();
        unit.setName(request.getName());
        unit.setCapacity(request.getCapacity());
        if (request.getStationId() != null && !request.getStationId().isBlank()) {
            StationNode station = new StationNode();
            station.setId(request.getStationId());
            unit.setStation(station);
        }
        return ResponseEntity.ok(ApiResponse.ok(deviceService.createUnit(unit)));
    }

    @PostMapping("/clusters")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<ApiResponse<BatteryClusterNode>> createCluster(@RequestBody DeviceRequest request) {
        BatteryClusterNode cluster = new BatteryClusterNode();
        cluster.setName(request.getName());
        cluster.setClusterNo(request.getClusterNo());
        if (request.getUnitId() != null && !request.getUnitId().isBlank()) {
            BatteryUnitNode unit = new BatteryUnitNode();
            unit.setId(request.getUnitId());
            cluster.setBatteryUnit(unit);
        }
        return ResponseEntity.ok(ApiResponse.ok(deviceService.createCluster(cluster)));
    }

    @GetMapping("/analogs")
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<ApiResponse<List<DeviceResponse>>> getAnalogs(@RequestParam String stationId) {
        return ResponseEntity.ok(ApiResponse.ok(deviceService.getAnalogsDto(stationId)));
    }

    @PutMapping("/analogs/{id}")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<ApiResponse<AnalogNode>> updateAnalog(@PathVariable String id, @RequestBody DeviceRequest request) {
        AnalogNode analog = new AnalogNode();
        analog.setAnalogCode(request.getAnalogCode());
        analog.setCellId(request.getCellId());
        analog.setDescription(request.getDescription());
        analog.setUnit(request.getUnit());
        analog.setDataType(request.getDataType());
        return ResponseEntity.ok(ApiResponse.ok(deviceService.updateAnalog(id, analog)));
    }
}
