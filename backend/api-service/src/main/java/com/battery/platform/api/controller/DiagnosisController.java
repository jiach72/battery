package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.dto.DiagnosisCaseDTO;
import com.battery.platform.api.service.DiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/diagnosis")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VIEWER')")
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    @GetMapping("/cases")
    public ResponseEntity<ApiResponse<List<DiagnosisCaseDTO>>> getCases(@RequestParam Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.ok(diagnosisService.getDiagnosisCases(request)));
    }

    @GetMapping("/cases/current")
    public ResponseEntity<ApiResponse<DiagnosisCaseDTO>> getCurrentCase(
            @RequestParam(defaultValue = "case-001") String caseId) {
        return ResponseEntity.ok(ApiResponse.ok(diagnosisService.getDiagnosisCase(caseId)));
    }
}
