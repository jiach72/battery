package com.battery.platform.api.service;

import com.battery.platform.api.config.DemoDataProperties;
import com.battery.platform.api.dto.*;
import com.battery.platform.api.entity.mysql.AlarmEvent;
import com.battery.platform.api.entity.neo4j.AlarmRuleNode;
import com.battery.platform.api.repository.mysql.AlarmEventRepository;
import com.battery.platform.api.repository.neo4j.AlarmRuleNodeRepository;
import com.battery.platform.api.repository.redis.RedisOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlarmService {

    private final AlarmEventRepository alarmEventRepository;
    private final AlarmRuleNodeRepository alarmRuleNodeRepository;
    private final DemoDataService demoDataService;
    private final DemoDataProperties demoDataProperties;
    private final RedisOperationRepository redisOperationRepository;

    // ========== 告警事件 ==========

    public Page<AlarmEvent> getEventsPage(String status, String severity, Pageable pageable) {
        String normalizedStatus = status != null ? status.toUpperCase() : null;
        String normalizedSeverity = severity != null ? severity.toUpperCase() : null;
        try {
            Page<AlarmEvent> page;
            if (normalizedStatus != null && normalizedSeverity != null) {
                page = alarmEventRepository.findBySeverityAndStatus(normalizedSeverity, normalizedStatus, pageable);
            } else if (normalizedStatus != null) {
                page = alarmEventRepository.findByStatus(normalizedStatus, pageable);
            } else if (normalizedSeverity != null) {
                page = alarmEventRepository.findBySeverity(normalizedSeverity, pageable);
            } else {
                page = alarmEventRepository.findAll(pageable);
            }
            return !page.hasContent() && demoDataProperties.isEnabled() ? buildDemoEventPage(normalizedStatus, normalizedSeverity, pageable) : page;
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return buildDemoEventPage(normalizedStatus, normalizedSeverity, pageable);
            }
            throw new IllegalStateException("告警事件数据访问失败", e);
        }
    }

    @Transactional
    public AlarmEvent acknowledgeEvent(Long id) {
        AlarmEvent event = alarmEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("告警事件不存在: " + id));
        event.setStatus("ACKED");
        event.setAcknowledgedAt(LocalDateTime.now());
        return alarmEventRepository.save(event);
    }

    @Transactional
    public AlarmEvent resolveEvent(Long id) {
        AlarmEvent event = alarmEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("告警事件不存在: " + id));
        event.setStatus("RESOLVED");
        event.setResolvedAt(LocalDateTime.now());
        return alarmEventRepository.save(event);
    }

    @Transactional
    public List<AlarmEvent> bulkAcknowledgeEvents(List<Long> ids) {
        List<AlarmEvent> events = alarmEventRepository.findAllById(ids);
        LocalDateTime now = LocalDateTime.now();
        for (AlarmEvent event : events) {
            event.setStatus("ACKED");
            event.setAcknowledgedAt(now);
        }
        return alarmEventRepository.saveAll(events);
    }

    // ========== 告警规则 ==========

    public List<AlarmRuleNode> getRules() {
        try {
            List<AlarmRuleNode> rules = alarmRuleNodeRepository.findAll();
            return rules.isEmpty() && demoDataProperties.isEnabled() ? demoDataService.buildAlarmRules() : rules;
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return demoDataService.buildAlarmRules();
            }
            throw new IllegalStateException("告警规则数据访问失败", e);
        }
    }

    public PageResponse<AlarmRuleResponse> getRulesPage(int page, int size) {
        List<AlarmRuleNode> allRules = getRules();
        int start = page * size;
        int end = Math.min(start + size, allRules.size());
        if (start >= allRules.size()) {
            return new PageResponse<>(List.of(), 0, 0, page, size);
        }
        List<AlarmRuleNode> subList = allRules.subList(start, end);
        List<AlarmRuleResponse> content = subList.stream().map(this::toRuleResponse).toList();
        int totalPages = (int) Math.ceil((double) allRules.size() / size);
        return new PageResponse<>(content, allRules.size(), totalPages, page, size);
    }

    public AlarmRuleNode createRule(AlarmRuleNode rule) {
        if (rule.getSeverity() != null) {
            rule.setSeverity(rule.getSeverity().toUpperCase());
        }
        if (rule.getId() == null || rule.getId().isBlank()) {
            rule.setId("rule-demo-" + System.currentTimeMillis());
        }
        if (rule.getEnabled() == null) {
            rule.setEnabled(true);
        }
        try {
            AlarmRuleNode saved = alarmRuleNodeRepository.save(rule);
            // 缓存到Redis
            redisOperationRepository.setAlarmRule(saved.getId(), buildRuleCacheData(saved));
            return saved;
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return rule;
            }
            throw new IllegalStateException("告警规则创建失败", e);
        }
    }

    public AlarmRuleNode createRuleFromRequest(AlarmRuleRequest request) {
        AlarmRuleNode rule = new AlarmRuleNode();
        rule.setName(request.getName());
        rule.setSeverity(request.getSeverity());
        rule.setCondition(request.getConditionExpr());
        rule.setNotifyType(request.getNotifyType());
        return createRule(rule);
    }

    @Transactional
    public AlarmRuleNode updateRule(String id, AlarmRuleNode rule) {
        rule.setId(id);
        if (rule.getSeverity() != null) {
            rule.setSeverity(rule.getSeverity().toUpperCase());
        }
        try {
            if (!alarmRuleNodeRepository.existsById(id)) {
                throw new IllegalArgumentException("告警规则不存在: " + id);
            }
            AlarmRuleNode saved = alarmRuleNodeRepository.save(rule);
            // 更新后清除并重建Redis缓存
            redisOperationRepository.deleteAlarmRule(id);
            redisOperationRepository.setAlarmRule(saved.getId(), buildRuleCacheData(saved));
            return saved;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            if (demoDataProperties.isEnabled()) {
                return rule;
            }
            throw new IllegalStateException("告警规则更新失败", e);
        }
    }

    public AlarmRuleNode updateRuleFromRequest(String id, AlarmRuleRequest request) {
        AlarmRuleNode rule = new AlarmRuleNode();
        rule.setName(request.getName());
        rule.setSeverity(request.getSeverity());
        rule.setCondition(request.getConditionExpr());
        rule.setNotifyType(request.getNotifyType());
        return updateRule(id, rule);
    }

    @Transactional
    public void deleteRule(String id) {
        if (!alarmRuleNodeRepository.existsById(id)) {
            throw new IllegalArgumentException("告警规则不存在: " + id);
        }
        alarmRuleNodeRepository.deleteById(id);
        // 删除后清除Redis缓存
        redisOperationRepository.deleteAlarmRule(id);
    }

    // ========== 兼容旧接口 ==========

    public Map<String, Object> createRulePayload(Map<String, Object> request) {
        return toPayload(createRule(toRuleNode(request.get("id"), request)));
    }

    public Map<String, Object> updateRulePayload(String id, Map<String, Object> request) {
        Map<String, Object> merged = new LinkedHashMap<>();
        alarmRuleNodeRepository.findById(id).ifPresent(existing -> {
            merged.put("name", existing.getName());
            merged.put("condition", existing.getCondition());
            merged.put("riskType", existing.getRiskType());
            merged.put("severity", existing.getSeverity());
            merged.put("notifyType", existing.getNotifyType());
            merged.put("enabled", existing.getEnabled());
        });
        merged.putAll(request);
        return toPayload(updateRule(id, toRuleNode(id, merged)));
    }

    // ========== DTO 转换方法 ==========

    public AlarmEventResponse toResponse(AlarmEvent event) {
        AlarmEventResponse response = new AlarmEventResponse();
        response.setId(event.getId());
        response.setDeviceId(event.getDeviceId());
        response.setSeverity(event.getSeverity());
        response.setMessage(event.getDescription());
        response.setStatus(event.getStatus());
        response.setCreatedAt(event.getCreatedAt());
        return response;
    }

    public AlarmRuleResponse toRuleResponse(AlarmRuleNode rule) {
        AlarmRuleResponse resp = new AlarmRuleResponse();
        resp.setId(rule.getId());
        resp.setName(rule.getName());
        resp.setSeverity(rule.getSeverity());
        resp.setConditionExpr(rule.getCondition());
        resp.setEnabled(rule.getEnabled());
        resp.setNotifyType(rule.getNotifyType());
        return resp;
    }

    // ========== 内部辅助方法 ==========

    private Page<AlarmEvent> buildDemoEventPage(String status, String severity, Pageable pageable) {
        List<AlarmEvent> filtered = demoDataService.buildAlarmEvents().stream()
                .filter(event -> status == null || status.equalsIgnoreCase(event.getStatus()))
                .filter(event -> severity == null || severity.equalsIgnoreCase(event.getSeverity()))
                .sorted(Comparator.comparing(AlarmEvent::getCreatedAt).reversed())
                .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<AlarmEvent> pageContent = start >= filtered.size() ? List.of() : filtered.subList(start, end);
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    private Map<String, String> buildRuleCacheData(AlarmRuleNode rule) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("id", rule.getId());
        data.put("name", rule.getName());
        data.put("condition", rule.getCondition());
        data.put("severity", rule.getSeverity());
        data.put("notifyType", rule.getNotifyType());
        data.put("enabled", String.valueOf(rule.getEnabled()));
        return data;
    }

    private Map<String, Object> buildRulePayload(Object id, Map<String, Object> request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", id != null ? String.valueOf(id) : "rule-demo-" + System.currentTimeMillis());
        payload.put("name", request.getOrDefault("name", "未命名规则"));
        payload.put("condition", request.getOrDefault("condition", ""));
        payload.put("riskType", request.getOrDefault("riskType", "capacity_risk"));
        Object severity = request.getOrDefault("severity", "medium");
        payload.put("severity", String.valueOf(severity).toUpperCase());
        Object notifyType = request.get("notifyType");
        if (notifyType instanceof List<?> list) {
            payload.put("notifyType", list.stream().map(String::valueOf).collect(Collectors.joining(",")));
        } else {
            payload.put("notifyType", notifyType != null ? String.valueOf(notifyType) : "websocket");
        }
        Object enabled = request.get("enabled");
        payload.put("enabled", enabled instanceof Boolean bool ? bool : true);
        return payload;
    }

    private AlarmRuleNode toRuleNode(Object id, Map<String, Object> request) {
        Map<String, Object> payload = buildRulePayload(id, request);
        AlarmRuleNode rule = new AlarmRuleNode();
        rule.setId(String.valueOf(payload.get("id")));
        rule.setName(String.valueOf(payload.get("name")));
        rule.setCondition(String.valueOf(payload.get("condition")));
        rule.setRiskType(String.valueOf(payload.get("riskType")));
        rule.setSeverity(String.valueOf(payload.get("severity")));
        rule.setNotifyType(String.valueOf(payload.get("notifyType")));
        rule.setEnabled(Boolean.TRUE.equals(payload.get("enabled")));
        return rule;
    }

    private Map<String, Object> toPayload(AlarmRuleNode rule) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", rule.getId());
        payload.put("name", rule.getName());
        payload.put("condition", rule.getCondition());
        payload.put("riskType", rule.getRiskType());
        payload.put("severity", rule.getSeverity());
        payload.put("notifyType", rule.getNotifyType());
        payload.put("enabled", rule.getEnabled());
        return payload;
    }
}
