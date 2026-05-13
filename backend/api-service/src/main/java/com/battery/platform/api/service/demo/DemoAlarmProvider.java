package com.battery.platform.api.service.demo;

import com.battery.platform.api.entity.mysql.AlarmEvent;
import com.battery.platform.api.entity.neo4j.AlarmRuleNode;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DemoAlarmProvider {

    public List<AlarmEvent> buildAlarmEvents() {
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        return List.of(
                buildAlarmEvent(1001L, "R001", "簇温升速率异常", "HIGH", "cluster-4", "北区1号站-2号单元-簇4", "簇温度在 15 分钟内上升 7.2℃，建议立即核查冷却支路。", "UNACK", now.minusMinutes(8), 41.7, 38.0),
                buildAlarmEvent(1002L, "R002", "末端电压离散超阈值", "HIGH", "cluster-7", "北区1号站-2号单元-簇7", "充电末端最大压差达到 112mV，存在一致性恶化趋势。", "UNACK", now.minusMinutes(23), 0.112, 0.085),
                buildAlarmEvent(1003L, "R003", "SOC 漂移偏大", "MEDIUM", "cluster-2", "北区1号站-1号单元-簇2", "SOC 漂移持续高于 6%，建议安排均衡维护。", "ACKED", now.minusMinutes(41), 6.4, 5.0),
                buildAlarmEvent(1004L, "R004", "单体温差异常", "MEDIUM", "cluster-5", "北区1号站-2号单元-簇5", "簇内温差达到 5.6℃，冷却均匀性下降。", "UNACK", now.minusHours(2), 5.6, 4.0),
                buildAlarmEvent(1005L, "R005", "容量衰减偏快", "LOW", "cluster-1", "北区1号站-1号单元-簇1", "近 30 天 SOH 下降 0.9%，高于站内平均水平。", "RESOLVED", now.minusHours(5), 0.9, 0.6),
                buildAlarmEvent(1006L, "R006", "充电电流波动异常", "MEDIUM", "cluster-3", "北区1号站-1号单元-簇3", "充电阶段出现异常电流抖动，建议复核 BMS 采样链路。", "ACKED", now.minusHours(7), 15.2, 10.0),
                buildAlarmEvent(1007L, "R007", "簇内 SOC 不均衡", "LOW", "cluster-6", "东区2号站-1号单元-簇6", "簇内 SOC 离散度升高，建议安排均衡维护窗口。", "UNACK", now.minusHours(9), 8.3, 6.0),
                buildAlarmEvent(1008L, "R008", "热管理响应迟滞", "MEDIUM", "cluster-8", "东区2号站-2号单元-簇8", "冷却启动后温升回落速度偏慢，需要检查风冷回路。", "UNACK", now.minusHours(11), 4.8, 3.5)
        );
    }

    public List<AlarmRuleNode> buildAlarmRules() {
        return List.of(
                buildAlarmRule("rule-temp-rate", "簇温升速率异常", "tempRiseRate>5.5", "temp_risk", "HIGH", "websocket,email", true),
                buildAlarmRule("rule-volt-diff", "末端电压离散超阈值", "chargeEndVoltDiff>0.085", "volt_risk", "HIGH", "websocket,email,sms", true),
                buildAlarmRule("rule-soc-drift", "SOC 漂移偏大", "socDrift>5", "capacity_risk", "MEDIUM", "websocket", true),
                buildAlarmRule("rule-thermal-balance", "单体温差异常", "tempSpread>4", "temp_risk", "MEDIUM", "websocket", true)
        );
    }

    private AlarmRuleNode buildAlarmRule(String id, String name, String condition, String riskType, String severity, String notifyType, boolean enabled) {
        AlarmRuleNode rule = new AlarmRuleNode();
        rule.setId(id);
        rule.setName(name);
        rule.setCondition(condition);
        rule.setRiskType(riskType);
        rule.setSeverity(severity);
        rule.setNotifyType(notifyType);
        rule.setEnabled(enabled);
        return rule;
    }

    private AlarmEvent buildAlarmEvent(Long id, String ruleId, String ruleName, String severity, String deviceId, String deviceName, String description,
                                       String status, LocalDateTime createdAt, Double triggerValue, Double threshold) {
        AlarmEvent event = new AlarmEvent();
        event.setId(id);
        event.setRuleId(ruleId);
        event.setRuleName(ruleName);
        event.setSeverity(severity);
        event.setDeviceId(deviceId);
        event.setDeviceName(deviceName);
        event.setDescription(description);
        event.setConditionExpr(ruleName);
        event.setStatus(status);
        event.setTriggerValue(triggerValue);
        event.setThreshold(threshold);
        event.setCreatedAt(createdAt);
        if ("ACKED".equals(status)) {
            event.setAcknowledgedAt(createdAt.plusMinutes(12));
        }
        if ("RESOLVED".equals(status)) {
            event.setResolvedAt(createdAt.plusHours(3));
        }
        return event;
    }
}
