package com.battery.platform.api.entity.mysql;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "data_system_log")
public class SystemLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id") private String userId;
    private String username;
    @Column(name = "action", length = 20) private String action;
    @Column(columnDefinition = "TEXT") private String detail;
    @Column(name = "ip_address") private String ipAddress;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
