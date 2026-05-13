package com.battery.platform.api.controller;

import com.battery.platform.api.dto.*;
import com.battery.platform.api.entity.neo4j.AlarmRuleNode;
import com.battery.platform.api.service.AlarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alarm")
@RequiredArgsConstructor
public class AlarmController {

    private final AlarmService alarmService;

    @GetMapping("/events")
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<ApiResponse<Page<AlarmEventResponse>>> getEvents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AlarmEventResponse> result = alarmService.getEventsPage(status, severity, pageable)
                .map(alarmService::toResponse);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/events/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<AlarmEventResponse>> acknowledgeEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(alarmService.toResponse(alarmService.acknowledgeEvent(id))));
    }

    @PostMapping("/events/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<AlarmEventResponse>> resolveEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(alarmService.toResponse(alarmService.resolveEvent(id))));
    }

    @PostMapping("/events/bulk-acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<List<AlarmEventResponse>>> bulkAcknowledgeEvents(
            @RequestBody List<Long> ids) {
        List<AlarmEventResponse> results = alarmService.bulkAcknowledgeEvents(ids).stream()
                .map(alarmService::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/rules")
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<ApiResponse<PageResponse<AlarmRuleResponse>>> getRules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(alarmService.getRulesPage(page, size)));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AlarmRuleResponse>> createRule(
            @Valid @RequestBody AlarmRuleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(alarmService.toRuleResponse(alarmService.createRuleFromRequest(request))));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AlarmRuleResponse>> updateRule(
            @PathVariable String id, @Valid @RequestBody AlarmRuleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(alarmService.toRuleResponse(alarmService.updateRuleFromRequest(id, request))));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable String id) {
        alarmService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
