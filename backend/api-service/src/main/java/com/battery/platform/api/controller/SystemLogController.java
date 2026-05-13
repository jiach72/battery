package com.battery.platform.api.controller;

import com.battery.platform.api.dto.ApiResponse;
import com.battery.platform.api.entity.mysql.SystemLog;
import com.battery.platform.api.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemLogController {

    private final SystemLogService systemLogService;

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<SystemLog>>> getLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(systemLogService.getLogs(action, startTime, endTime, pageable)));
    }
}
