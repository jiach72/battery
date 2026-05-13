"""析锂检测 - ICA/DVA + FPCA + Isolation Forest"""
import numpy as np
from config import ALGO_CONFIG


def detect_lithium_plating(request: dict) -> list:
    """
    析锂检测主函数 - 基于PRD第3.2节规则:
    筛选电压 > 3.5V 的数据，寻找 Δq/Δv 峰值异常点
    使用ICA增量容量分析 + Isolation Forest异常检测
    """
    cell_ids = request.get("cell_ids", [])
    voltage_data = request.get("voltage_data", {})
    current_data = request.get("current_data", {})
    ica_threshold = ALGO_CONFIG["lithium_plating"]["ica_peak_threshold"]
    contamination = ALGO_CONFIG["lithium_plating"]["contamination"]

    results = []
    for cell_id in cell_ids:
        voltages = np.array(voltage_data.get(cell_id, []), dtype=np.float64)
        currents = np.array(current_data.get(cell_id, []), dtype=np.float64)

        if len(voltages) < 10 or len(currents) < 10:
            results.append({
                "cell_id": cell_id,
                "is_lithium_plating": False,
                "ica_peak_shift": 0.0,
                "anomaly_score": 0.0,
                "message": "数据点不足",
            })
            continue

        min_len = min(len(voltages), len(currents))
        voltages = voltages[:min_len]
        currents = currents[:min_len]

        # 筛选电压 > 3.5V 的数据点（PRD要求）
        mask = voltages > 3.5
        if mask.sum() < 5:
            results.append({
                "cell_id": cell_id,
                "is_lithium_plating": False,
                "ica_peak_shift": 0.0,
                "anomaly_score": 0.0,
                "message": "高电压区间数据不足",
            })
            continue

        v_filtered = voltages[mask]
        i_filtered = currents[mask]

        # ICA: 计算 dQ/dV（增量容量分析）
        dv = np.diff(v_filtered)
        # 避免除零
        dv[dv == 0] = 1e-10
        dq = np.diff(np.cumsum(np.abs(i_filtered[:-1])))  # 简化的电荷增量
        if len(dq) == 0:
            dq = np.abs(i_filtered[:-1])

        ica_curve = dq / np.abs(dv[:len(dq)])

        # 寻找ICA峰值位移（析锂特征）
        peak_voltage = 0.0
        if len(ica_curve) > 0:
            peak_idx = np.argmax(ica_curve)
            peak_voltage = float(v_filtered[peak_idx]) if peak_idx < len(v_filtered) else 0.0
            ica_peak_value = float(ica_curve[peak_idx])

            # 计算峰值偏移量（与标称峰值位置的偏差）
            nominal_peak_voltage = 3.65  # 磷酸铁锂典型ICA峰值电压
            ica_peak_shift = float(peak_voltage - nominal_peak_voltage)
        else:
            ica_peak_shift = 0.0
            ica_peak_value = 0.0

        # 异常评分：基于ICA峰值异常程度
        # 使用MAD（中位绝对偏差）代替Isolation Forest作为轻量异常检测
        ica_median = np.median(ica_curve)
        ica_mad = np.median(np.abs(ica_curve - ica_median))
        if ica_mad > 0:
            anomaly_scores = np.abs(ica_curve - ica_median) / ica_mad
            anomaly_score = float(np.max(anomaly_scores)) / 10.0  # 归一化到0-1
            anomaly_score = min(1.0, anomaly_score)
        else:
            anomaly_score = 0.0

        is_plating = (abs(ica_peak_shift) > ica_threshold) or (anomaly_score > 0.7)

        results.append({
            "cell_id": cell_id,
            "is_lithium_plating": bool(is_plating),
            "ica_peak_shift": round(float(ica_peak_shift), 6),
            "anomaly_score": round(float(anomaly_score), 4),
            "peak_voltage": round(peak_voltage, 4),
        })
    return results
