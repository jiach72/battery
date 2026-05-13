package com.battery.platform.api.service;

import com.battery.platform.api.entity.mysql.SystemLog;
import com.battery.platform.api.repository.mysql.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SystemLogService {

    private final SystemLogRepository systemLogRepository;

    public Page<SystemLog> getLogs(String action, String startTime, String endTime, Pageable pageable) {
        if (action != null && startTime != null && endTime != null) {
            LocalDateTime start = LocalDateTime.parse(startTime);
            LocalDateTime end = LocalDateTime.parse(endTime);
            return systemLogRepository.findByActionAndCreatedAtBetween(action, start, end, pageable);
        } else if (action != null) {
            return systemLogRepository.findByAction(action, pageable);
        }
        return systemLogRepository.findAll(pageable);
    }
}
