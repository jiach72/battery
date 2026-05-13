package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.entity.mysql.BillElectricity;
import com.battery.platform.api.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bill")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VIEWER')")
public class BillController {

    private final BillService billService;

    @GetMapping("/electricity")
    public ResponseEntity<ApiResponse<Page<BillElectricity>>> getElectricity(
            @RequestParam String stationId,
            @RequestParam(required = false) String month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(billService.getElectricity(stationId, month, pageable)));
    }
}
