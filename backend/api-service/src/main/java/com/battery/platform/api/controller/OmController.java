package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.service.OmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/om")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OPERATOR')")
public class OmController {

    private final OmService omService;

    @PostMapping("/simulate-plan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulatePlan(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.ok(omService.simulatePlan(request)));
    }
}
