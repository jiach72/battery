package com.battery.platform.api.alarm;

import com.battery.platform.api.entity.mysql.AlarmEvent;
import com.battery.platform.api.entity.neo4j.AlarmRuleNode;
import com.battery.platform.api.repository.mysql.AlarmEventRepository;
import com.battery.platform.api.repository.neo4j.AlarmRuleNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlarmRuleMatcher {

    private static final String ALARM_RULE_CACHE_KEY = "alarm_rule:all";

    private final AlarmRuleNodeRepository alarmRuleNodeRepository;
    private final AlarmEventRepository alarmEventRepository;
    private final AlarmWebSocketHandler alarmWebSocketHandler;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 刷新规则缓存（规则CRUD操作后应调用此方法）
     */
    public void refreshRuleCache() {
        try {
            List<AlarmRuleNode> rules = alarmRuleNodeRepository.findByEnabledTrue();
            redisTemplate.delete(ALARM_RULE_CACHE_KEY);
            for (AlarmRuleNode rule : rules) {
                redisTemplate.opsForHash().put(ALARM_RULE_CACHE_KEY, rule.getId(), rule);
            }
            log.info("告警规则缓存已刷新, 共 {} 条规则", rules.size());
        } catch (Exception e) {
            log.warn("告警规则缓存刷新失败: {}", e.getMessage());
        }
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public void matchAndPersist(String message) {
        // 优先从Redis缓存读取规则
        List<Object> cachedRules = redisTemplate.opsForHash().values(ALARM_RULE_CACHE_KEY);
        List<AlarmRuleNode> rules;
        if (cachedRules != null && !cachedRules.isEmpty()) {
            rules = cachedRules.stream()
                    .filter(r -> r instanceof AlarmRuleNode)
                    .map(r -> (AlarmRuleNode) r)
                    .toList();
        } else {
            // 缓存miss时回退到数据库查询并重建缓存
            rules = alarmRuleNodeRepository.findByEnabledTrue();
            refreshRuleCache();
        }

        for (AlarmRuleNode rule : rules) {
            if (matchesRule(message, rule)) {
                AlarmEvent event = new AlarmEvent();
                event.setRuleId(rule.getId());
                event.setRuleName(rule.getName());
                event.setSeverity(rule.getSeverity());
                event.setDescription("告警规则 [" + rule.getName() + "] 触发: " + message);
                event.setConditionExpr(rule.getCondition());
                event.setStatus("UNACK");
                event = alarmEventRepository.save(event);
                alarmWebSocketHandler.broadcastAlarm(event);
                log.info("告警事件已持久化并推送: eventId={}, ruleId={}", event.getId(), rule.getId());
            }
        }
    }

    private boolean matchesRule(String message, AlarmRuleNode rule) {
        if (message == null || rule.getCondition() == null) {
            return false;
        }
        // 条件表达式匹配：支持 key>value / key<value / key==value 格式
        String condition = rule.getCondition().trim();
        if (condition.contains(">") || condition.contains("<") || condition.contains("==")) {
            return evaluateExpression(message, condition);
        }
        // 回退到关键词匹配
        return message.contains(condition);
    }

    private boolean evaluateExpression(String message, String condition) {
        try {
            String operator;
            if (condition.contains(">=")) operator = ">=";
            else if (condition.contains("<=")) operator = "<=";
            else if (condition.contains("==")) operator = "==";
            else if (condition.contains(">")) operator = ">";
            else if (condition.contains("<")) operator = "<";
            else return false;

            String[] parts = condition.split(operator, 2);
            if (parts.length != 2) return false;

            String key = parts[0].trim();
            double threshold = Double.parseDouble(parts[1].trim());

            // 从消息中提取对应key的值（JSON格式匹配）
            String searchKey = "\"" + key + "\":";
            int idx = message.indexOf(searchKey);
            if (idx < 0) return false;

            String valueStr = message.substring(idx + searchKey.length()).trim();
            // 提取数值部分
            StringBuilder numStr = new StringBuilder();
            for (char c : valueStr.toCharArray()) {
                if (Character.isDigit(c) || c == '.' || c == '-') {
                    numStr.append(c);
                } else if (numStr.length() > 0) {
                    break;
                }
            }
            if (numStr.length() == 0) return false;
            double value = Double.parseDouble(numStr.toString());

            return switch (operator) {
                case ">=" -> value >= threshold;
                case "<=" -> value <= threshold;
                case "==" -> Math.abs(value - threshold) < 0.0001;
                case ">" -> value > threshold;
                case "<" -> value < threshold;
                default -> false;
            };
        } catch (Exception e) {
            log.warn("条件表达式解析失败: condition={}, error={}", condition, e.getMessage());
            return false;
        }
    }
}
