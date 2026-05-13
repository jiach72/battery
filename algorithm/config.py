"""静态配置 - general_map字典与全局参数"""
import os
from datetime import datetime

# 通用映射字典: BMS测点编码 → 平台数据项
general_map = {
    "V_BAT": "voltage",
    "I_BAT": "current",
    "T_BAT": "temperature",
    "SOC": "soc",
    "SOH": "soh",
}

# 储能零时刻（投运日期）
energy_zero_date = datetime(2024, 1, 1)

# 算法参数
ALGO_CONFIG = {
    "soh": {
        "prediction_horizon_days": 30,
        "min_data_points": 100,
    },
    "micro_short_circuit": {
        "percentile_threshold": 5,  # 5%分位数
        "rlmqd_window": 30,
    },
    "lithium_plating": {
        "ica_peak_threshold": 0.01,
        "contamination": 0.05,
    },
    "dcir": {
        "ecm_order": 2,  # Thevenin二阶模型
        "rls_forgetting_factor": 0.998,
        "current_gradient_threshold": 5.0,  # A/s
        "slice_window_seconds": 10,
    },
    "consistency": {
        "dbscan_eps": 0.5,
        "dbscan_min_samples": 5,
        "som_grid_size": 10,
    },
    "om": {
        "max_replace_packs": 20,
        "max_capacity_grading": 100,
    },
}

# Kafka topics
KAFKA_TOPICS = {
    "bms_raw": "bms-raw-data",
    "alarm": "alarm",
    "algorithm_result": "algorithm-result",
}

ALGORITHM_BASE_URL = os.getenv("ALGORITHM_BASE_URL", "http://algorithm:8000")

# MQTT 配置
MQTT_CONFIG = {
    "broker": os.getenv("MQTT_BROKER", "localhost"),
    "port": int(os.getenv("MQTT_PORT", 1883)),
    "topic_prefix": os.getenv("MQTT_TOPIC_PREFIX", "bms/"),
}
