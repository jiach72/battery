package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.dto.DashboardOverviewDTO;
import com.battery.platform.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VIEWER')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewDTO>> getOverview(
            @RequestParam(defaultValue = "eu-1") String energyUnitId) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getOverview(energyUnitId)));
    }

    @GetMapping("/realtime/clusters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRealtimeClusters(
            @RequestParam(defaultValue = "eu-1") String energyUnitId) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRealtimeClusters(energyUnitId)));
    }
}
