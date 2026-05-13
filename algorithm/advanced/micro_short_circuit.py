"""微短路检测 - Pseudo-OCV差分残差 + RLMQD自适应阈值"""
import numpy as np
import pandas as pd
from config import ALGO_CONFIG


def detect_micro_short_circuit(request: dict) -> list:
    """
    微短路检测主函数 - 基于PRD第3.2节规则:
    计算同层级单体充放电末端电压的5%分位数，小于此值判定为微短路
    """
    cell_ids = request.get("cell_ids", [])
    voltage_data = request.get("voltage_data", {})
    percentile = ALGO_CONFIG["micro_short_circuit"]["percentile_threshold"]
    window = ALGO_CONFIG["micro_short_circuit"]["rlmqd_window"]

    results = []
    for cell_id in cell_ids:
        cell_voltages = voltage_data.get(cell_id, [])
        if len(cell_voltages) == 0:
            results.append({
                "cell_id": cell_id,
                "is_short_circuit": False,
                "residual_value": 0.0,
                "threshold": 0.0,
                "confidence": 0.0,
                "message": "无电压数据",
            })
            continue

        voltages = np.array(cell_voltages, dtype=np.float64)

        # 计算5%分位数作为微短路阈值（PRD要求）
        voltage_5pct = np.percentile(voltages, percentile)
        voltage_mean = np.mean(voltages)
        voltage_std = np.std(voltages)

        # Pseudo-OCV差分残差：与均值的偏差
        residual = voltage_5pct - voltage_mean

        # RLMQD自适应阈值：基于滑动窗口标准差
        if len(voltages) >= window:
            rolling_std = pd.Series(voltages).rolling(window=window).std().dropna()
            adaptive_threshold = -np.mean(rolling_std) * 2
        else:
            adaptive_threshold = -voltage_std * 2

        is_short = residual < adaptive_threshold
        # 置信度：残差越大于阈值，置信度越高
        if adaptive_threshold != 0:
            confidence = min(1.0, abs(residual / adaptive_threshold))
        else:
            confidence = 0.0

        results.append({
            "cell_id": cell_id,
            "is_short_circuit": bool(is_short),
            "residual_value": round(float(residual), 6),
            "threshold": round(float(adaptive_threshold), 6),
            "confidence": round(float(confidence), 4),
            "voltage_5pct": round(float(voltage_5pct), 4),
            "voltage_mean": round(float(voltage_mean), 4),
        })
    return results
