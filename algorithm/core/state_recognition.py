"""充放电状态识别"""
import pandas as pd
import numpy as np


def recognize_charge_discharge(df: pd.DataFrame, current_col: str = "current",
                                charge_threshold: float = 5.0,
                                discharge_threshold: float = -5.0) -> pd.DataFrame:
    """识别充放电状态"""
    conditions = [
        (df[current_col] > charge_threshold, "CHARGE"),
        (df[current_col] < discharge_threshold, "DISCHARGE"),
    ]
    df["state"] = np.select([c[0] for c in conditions], [c[1] for c in conditions], default="STANDBY")
    return df


# Backward compatibility for older startup imports.
identify_charge_discharge_state = recognize_charge_discharge


def extract_charge_cycles(df: pd.DataFrame) -> list:
    """提取完整充电周期"""
    cycles = []
    in_charge = False
    start_idx = 0
    for i, row in df.iterrows():
        if row["state"] == "CHARGE" and not in_charge:
            in_charge = True
            start_idx = i
        elif row["state"] != "CHARGE" and in_charge:
            in_charge = False
            if i - start_idx > 10:
                cycles.append(df.loc[start_idx:i])
    return cycles
