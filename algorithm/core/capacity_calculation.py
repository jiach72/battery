"""安时积分法容量计算"""
import pandas as pd
import numpy as np


def calculate_capacity_by_coulomb(df: pd.DataFrame, current_col: str = "current",
                                   time_col: str = "timestamp",
                                   nominal_capacity: float = 280.0) -> pd.DataFrame:
    """安时积分法计算容量 (Ah)"""
    df = df.copy()
    dt = pd.to_datetime(df[time_col]).diff().dt.total_seconds()
    df["delta_ah"] = df[current_col] * dt / 3600.0
    df["cumulative_ah"] = df["delta_ah"].cumsum()
    return df


# Backward compatibility for older startup imports.
calculate_capacity_ah = calculate_capacity_by_coulomb


def calculate_discharge_capacity(df: pd.DataFrame) -> float:
    """计算单次放电容量"""
    discharge_data = df[df["state"] == "DISCHARGE"]
    if discharge_data.empty:
        return 0.0
    return abs(discharge_data["delta_ah"].sum())
