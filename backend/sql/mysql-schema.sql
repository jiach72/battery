-- ============================================================
-- Battery Health Platform - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS battery_platform
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE battery_platform;

-- -----------------------------------------------------------
-- 告警事件表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_alarm_event (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    rule_id         VARCHAR(64)     DEFAULT NULL COMMENT '规则ID',
    rule_name       VARCHAR(128)    DEFAULT NULL COMMENT '规则名称',
    severity        VARCHAR(10)     DEFAULT NULL COMMENT '严重程度: CRITICAL/WARNING/INFO',
    device_id       VARCHAR(64)     DEFAULT NULL COMMENT '设备ID',
    device_name     VARCHAR(128)    DEFAULT NULL COMMENT '设备名称',
    description     TEXT            DEFAULT NULL COMMENT '告警描述',
    condition_expr  TEXT            DEFAULT NULL COMMENT '触发条件表达式',
    trigger_value   DOUBLE          DEFAULT NULL COMMENT '触发值',
    threshold       DOUBLE          DEFAULT NULL COMMENT '阈值',
    status          VARCHAR(10)     DEFAULT 'UNACK' COMMENT '状态: UNACK/ACKED/RESOLVED',
    created_at      DATETIME        DEFAULT NULL COMMENT '创建时间',
    acknowledged_at DATETIME        DEFAULT NULL COMMENT '确认时间',
    resolved_at     DATETIME        DEFAULT NULL COMMENT '解决时间',
    PRIMARY KEY (id),
    INDEX idx_alarm_severity (severity),
    INDEX idx_alarm_status (status),
    INDEX idx_alarm_device (device_id),
    INDEX idx_alarm_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警事件表';

-- -----------------------------------------------------------
-- 电费账单表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_bill_electricity (
    id                BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    station_id        VARCHAR(64)     DEFAULT NULL COMMENT '站点ID',
    bill_month        VARCHAR(10)     DEFAULT NULL COMMENT '账单月份(yyyy-MM)',
    charge_amount     DECIMAL(12,2)   DEFAULT NULL COMMENT '充电量(kWh)',
    discharge_amount  DECIMAL(12,2)   DEFAULT NULL COMMENT '放电量(kWh)',
    charge_cost       DECIMAL(12,2)   DEFAULT NULL COMMENT '充电成本(元)',
    discharge_revenue DECIMAL(12,2)   DEFAULT NULL COMMENT '放电收入(元)',
    net_profit        DECIMAL(12,2)   DEFAULT NULL COMMENT '净利润(元)',
    created_at        DATE            DEFAULT NULL COMMENT '创建日期',
    PRIMARY KEY (id),
    INDEX idx_bill_station (station_id),
    INDEX idx_bill_month (bill_month),
    UNIQUE INDEX uk_station_month (station_id, bill_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电费账单表';

-- -----------------------------------------------------------
-- 系统日志表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_system_log (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id         VARCHAR(64)     DEFAULT NULL COMMENT '用户ID',
    username        VARCHAR(64)     DEFAULT NULL COMMENT '用户名',
    action          VARCHAR(20)     DEFAULT NULL COMMENT '操作类型: LOGIN/LOGOUT/CREATE/UPDATE/DELETE',
    detail          TEXT            DEFAULT NULL COMMENT '操作详情',
    ip_address      VARCHAR(45)     DEFAULT NULL COMMENT 'IP地址',
    created_at      DATETIME        DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (id),
    INDEX idx_log_user (user_id),
    INDEX idx_log_action (action),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- ============================================================
-- Performance indexes for common query patterns
-- ============================================================
CREATE INDEX idx_alarm_device_created ON data_alarm_event(device_id, created_at);
CREATE INDEX idx_alarm_severity_status ON data_alarm_event(severity, status);
CREATE INDEX idx_alarm_status_created ON data_alarm_event(status, created_at);
CREATE INDEX idx_log_user_created ON data_system_log(user_id, created_at);
CREATE INDEX idx_bill_month ON data_bill_electricity(bill_month);
