package com.battery.platform.api.repository.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.battery.platform.api.dto.DashboardOverviewDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Redis 四前缀操作封装
 * - rt_measure:{stationId}:{unitId}     → Hash  TTL=60s
 * - ledger_cache:{entityType}:{entityId} → Hash  TTL=1h
 * - alarm_rule:{ruleId}                  → Hash  TTL=24h
 * - analog_map:{stationId}               → Hash  TTL=1h
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisOperationRepository {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // ========== rt_measure 实时量测 ==========

    public void setRealtimeMeasure(String stationId, String unitId, Map<String, String> cellData) {
        String key = String.format("rt_measure:%s:%s", stationId, unitId);
        redisTemplate.opsForHash().putAll(key, cellData);
        redisTemplate.expire(key, 60, TimeUnit.SECONDS);
    }

    public Map<Object, Object> getRealtimeMeasure(String stationId, String unitId) {
        String key = String.format("rt_measure:%s:%s", stationId, unitId);
        return redisTemplate.opsForHash().entries(key);
    }

    // ========== ledger_cache 台账缓存 ==========

    public void cacheLedger(String entityType, String entityId, Map<String, String> data) {
        String key = String.format("ledger_cache:%s:%s", entityType, entityId);
        redisTemplate.opsForHash().putAll(key, data);
        redisTemplate.expire(key, 1, TimeUnit.HOURS);
    }

    public Map<Object, Object> getLedgerCache(String entityType, String entityId) {
        String key = String.format("ledger_cache:%s:%s", entityType, entityId);
        return redisTemplate.opsForHash().entries(key);
    }

    public void evictLedgerCache(String entityType, String entityId) {
        String key = String.format("ledger_cache:%s:%s", entityType, entityId);
        redisTemplate.delete(key);
    }

    // ========== alarm_rule 告警规则 ==========

    public void setAlarmRule(String ruleId, Map<String, String> ruleData) {
        String key = String.format("alarm_rule:%s", ruleId);
        redisTemplate.opsForHash().putAll(key, ruleData);
        redisTemplate.expire(key, 24, TimeUnit.HOURS);
    }

    public Map<Object, Object> getAlarmRule(String ruleId) {
        String key = String.format("alarm_rule:%s", ruleId);
        return redisTemplate.opsForHash().entries(key);
    }

    public void deleteAlarmRule(String ruleId) {
        String key = String.format("alarm_rule:%s", ruleId);
        redisTemplate.delete(key);
    }

    // ========== analog_map 量测映射 ==========

    public void setAnalogMapping(String stationId, Map<String, String> mappingData) {
        String key = String.format("analog_map:%s", stationId);
        redisTemplate.opsForHash().putAll(key, mappingData);
        redisTemplate.expire(key, 1, TimeUnit.HOURS);
    }

    public Map<Object, Object> getAnalogMapping(String stationId) {
        String key = String.format("analog_map:%s", stationId);
        return redisTemplate.opsForHash().entries(key);
    }

    public void deleteAnalogMapping(String stationId) {
        String key = String.format("analog_map:%s", stationId);
        redisTemplate.delete(key);
    }

    // ========== dashboard_overview 仪表盘概览缓存 ==========

    public DashboardOverviewDTO getDashboardOverview(String key) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, DashboardOverviewDTO.class);
        } catch (JsonProcessingException e) {
            log.warn("反序列化仪表盘缓存失败: {}", e.getMessage());
            return null;
        }
    }

    public void setDashboardOverview(String key, DashboardOverviewDTO data, int ttlSeconds) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(key, json, ttlSeconds, TimeUnit.SECONDS);
        } catch (JsonProcessingException e) {
            log.warn("序列化仪表盘缓存失败: {}", e.getMessage());
        }
    }
}
