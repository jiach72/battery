package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.dto.ImpedanceDiagnosisDTO;
import com.battery.platform.api.dto.ImpedanceSpectrumDTO;
import com.battery.platform.api.service.ImpedanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/impedance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VIEWER')")
public class ImpedanceController {

    private final ImpedanceService impedanceService;

    @GetMapping("/spectrum")
    public ResponseEntity<ApiResponse<ImpedanceSpectrumDTO>> getSpectrum(
            @RequestParam(defaultValue = "cell-01") String cellId,
            @RequestParam(defaultValue = "deterministic-nyquist-baseline") String method) {
        return ResponseEntity.ok(ApiResponse.ok(impedanceService.getSpectrum(cellId, method)));
    }

    @GetMapping("/diagnosis")
    public ResponseEntity<ApiResponse<ImpedanceDiagnosisDTO>> diagnose(
            @RequestParam(defaultValue = "cell-01") String cellId,
            @RequestParam(defaultValue = "deterministic-nyquist-baseline") String method) {
        return ResponseEntity.ok(ApiResponse.ok(impedanceService.diagnose(cellId, method)));
    }
}
