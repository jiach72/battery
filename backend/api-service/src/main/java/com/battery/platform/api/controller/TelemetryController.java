package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.dto.TelemetrySchemaDTO;
import com.battery.platform.api.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/telemetry")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VIEWER')")
public class TelemetryController {

    private final TelemetryService telemetryService;

    @GetMapping("/schema")
    public ResponseEntity<ApiResponse<TelemetrySchemaDTO>> getSchema() {
        return ResponseEntity.ok(ApiResponse.ok(telemetryService.getSchema()));
    }
}
