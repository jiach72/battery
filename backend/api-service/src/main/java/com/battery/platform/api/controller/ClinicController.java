package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.dto.ClinicAssessmentDTO;
import com.battery.platform.api.service.ClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinic")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VIEWER')")
public class ClinicController {

    private final ClinicService clinicService;

    @PostMapping("/assessment-list")
    public ResponseEntity<ApiResponse<List<ClinicAssessmentDTO>>> getAssessmentList(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.ok(clinicService.getAssessmentList(request)));
    }

    @GetMapping("/cell/{cellId}/endpoint-analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEndpointAnalysis(
            @PathVariable String cellId,
            @RequestParam(defaultValue = "CHARGE") String type) {
        return ResponseEntity.ok(ApiResponse.ok(clinicService.getEndpointAnalysis(cellId, type)));
    }
}
