"""加权一致性得分计算"""
import pandas as pd
import numpy as np


WEIGHTS = {
    "voltage_range": 0.3,
    "temperature_range": 0.2,
    "soc_range": 0.2,
    "short_circuit_risk": 0.15,
    "liout_risk": 0.15,
}


def calculate_weighted_consistency(features: dict) -> float:
    """计算加权一致性得分 (0-100)"""
    score = 100.0
    if features.get("short_circuit_risk"):
        score -= WEIGHTS["short_circuit_risk"] * 100
    lithium_risk_score = features.get("lithium_risk_score", features.get("liout_risk_score", 0))
    if lithium_risk_score > 0.5:
        score -= WEIGHTS["liout_risk"] * 50

    voltage_range = features.get("charge_end_max_volt_diff", 0)
    if voltage_range > 0.1:
        score -= WEIGHTS["voltage_range"] * min(voltage_range * 100, 30)

    return round(max(0, score), 2)
