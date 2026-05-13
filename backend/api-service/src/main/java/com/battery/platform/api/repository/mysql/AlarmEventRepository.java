package com.battery.platform.api.repository.mysql;

import com.battery.platform.api.entity.mysql.AlarmEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlarmEventRepository extends JpaRepository<AlarmEvent, Long> {
    Page<AlarmEvent> findBySeverityAndStatus(String severity, String status, Pageable pageable);
    Page<AlarmEvent> findByStatus(String status, Pageable pageable);
    Page<AlarmEvent> findBySeverity(String severity, Pageable pageable);
    long countByStatus(String status);
    long countBySeverityAndStatus(String severity, String status);
}
