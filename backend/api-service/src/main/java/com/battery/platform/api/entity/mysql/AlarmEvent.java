package com.battery.platform.api.entity.mysql;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "data_alarm_event")
public class AlarmEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "rule_id") private String ruleId;
    @Column(name = "rule_name") private String ruleName;
    @Column(name = "severity", length = 10) private String severity;
    @Column(name = "device_id") private String deviceId;
    @Column(name = "device_name") private String deviceName;
    @Column(name = "description", columnDefinition = "TEXT") private String description;
    @Column(name = "condition_expr", columnDefinition = "TEXT") private String conditionExpr;
    @Column(name = "trigger_value") private Double triggerValue;
    @Column(name = "threshold") private Double threshold;
    @Column(name = "status", length = 10) private String status;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "acknowledged_at") private LocalDateTime acknowledgedAt;
    @Column(name = "resolved_at") private LocalDateTime resolvedAt;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "UNACK";
    }
}
