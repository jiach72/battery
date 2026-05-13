"""电压极差/短路/析锂特征提取"""
import pandas as pd
import numpy as np
from config import ALGO_CONFIG


def extract_voltage_range(df: pd.DataFrame) -> dict:
    """充电末端电压极差与标准差特征"""
    if "voltage" not in df.columns:
        return {}
    return {
        "charge_end_max_volt_diff": round(float(df["voltage"].max() - df["voltage"].min()), 4),
        "charge_end_volt_std": round(float(df["voltage"].std()), 4),
    }


def extract_short_circuit_features(df: pd.DataFrame) -> dict:
    """
    微短路特征提取 - PRD第3.2节:
    计算同层级单体充放电末端电压的5%分位数，小于此值判定为微短路
    """
    if "voltage" not in df.columns:
        return {}
    percentile = ALGO_CONFIG["micro_short_circuit"]["percentile_threshold"]
    voltage_5pct = float(df["voltage"].quantile(percentile / 100.0))
    voltage_mean = float(df["voltage"].mean())
    voltage_std = float(df["voltage"].std())
    deviation = voltage_5pct - voltage_mean
    return {
        "voltage_5pct": round(voltage_5pct, 4),
        "voltage_mean": round(voltage_mean, 4),
        "voltage_5pct_residual": round(deviation, 4),
        "short_circuit_risk": deviation < -(voltage_std * 2),
    }


def extract_lithium_features(df: pd.DataFrame) -> dict:
    """
    析锂特征提取 - PRD第3.2节:
    筛选电压 > 3.5V 的数据，寻找 Δq/Δv 峰值异常点
    """
    if "voltage" not in df.columns or "current" not in df.columns:
        return {
            "lithium_risk_score": 0.0,
            "liout_risk_score": 0.0,
            "ica_peak_shift": 0.0,
            "message": "缺少voltage或current数据",
        }

    # 筛选高电压区域数据（PRD要求 > 3.5V）
    high_v_mask = df["voltage"] > 3.5
    if high_v_mask.sum() < 5:
        return {
            "lithium_risk_score": 0.0,
            "liout_risk_score": 0.0,
            "ica_peak_shift": 0.0,
            "message": "高电压区间数据不足",
        }

    v = df.loc[high_v_mask, "voltage"].values
    i = df.loc[high_v_mask, "current"].values

    # 计算 dQ/dV (ICA)
    dv = np.diff(v)
    dv[dv == 0] = 1e-10
    dq = np.abs(np.diff(np.cumsum(np.abs(i[:-1]))))
    if len(dq) == 0:
        dq = np.abs(i[:-1])
    ica = dq / np.abs(dv[:len(dq)])

    if len(ica) == 0:
        return {"lithium_risk_score": 0.0, "liout_risk_score": 0.0, "ica_peak_shift": 0.0}

    # ICA峰值位移分析
    peak_idx = np.argmax(ica)
    peak_voltage = float(v[peak_idx]) if peak_idx < len(v) else 0
    nominal_peak = 3.65  # 磷酸铁锂典型ICA峰值
    ica_peak_shift = peak_voltage - nominal_peak

    # 风险评分：基于峰值偏移和异常程度
    ica_median = np.median(ica)
    ica_mad = np.median(np.abs(ica - ica_median))
    risk_score = 0.0
    if ica_mad > 0:
        anomaly = np.abs(float(ica[peak_idx]) - ica_median) / ica_mad
        risk_score = min(1.0, anomaly / 10.0)

    return {
        "lithium_risk_score": round(risk_score, 4),
        "liout_risk_score": round(risk_score, 4),
        "ica_peak_shift": round(ica_peak_shift, 4),
        "peak_voltage": round(peak_voltage, 4),
    }


def extract_charge_end_features(df: pd.DataFrame) -> dict:
    """充电末端综合特征提取"""
    features = {}
    features.update(extract_voltage_range(df))
    features.update(extract_short_circuit_features(df))

    # 充电末端SOC
    if "soc" in df.columns:
        features["charge_end_soc"] = round(float(df["soc"].iloc[-1]), 2)

    # 偏离度（电压标准差 / 均值）
    if "voltage" in df.columns:
        v_mean = df["voltage"].mean()
        v_std = df["voltage"].std()
        features["charge_end_voltage_deviation"] = round(float(v_std / v_mean * 100), 4) if v_mean > 0 else 0.0

    return features
