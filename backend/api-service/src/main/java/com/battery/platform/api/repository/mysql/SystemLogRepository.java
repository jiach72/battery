package com.battery.platform.api.repository.mysql;

import com.battery.platform.api.entity.mysql.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    Page<SystemLog> findByActionAndCreatedAtBetween(String action, LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<SystemLog> findByAction(String action, Pageable pageable);
}
