"""数据预处理 - 含 process_capacity_outlier"""
import pandas as pd
import numpy as np


def process_capacity_outlier(df: pd.DataFrame, column: str = "capacity",
                             lower_pct: float = 0.01, upper_pct: float = 0.99) -> pd.DataFrame:
    """处理容量异常值：使用分位数截断法"""
    if column not in df.columns:
        return df
    lower = df[column].quantile(lower_pct)
    upper = df[column].quantile(upper_pct)
    df[column] = df[column].clip(lower, upper)
    return df


def clean_missing_data(df: pd.DataFrame, method: str = "ffill") -> pd.DataFrame:
    """清洗缺失数据"""
    if method == "ffill":
        df = df.ffill()
    elif method == "interpolate":
        df = df.interpolate(method="linear")
    return df


def resample_timeseries(df: pd.DataFrame, freq: str = "5min") -> pd.DataFrame:
    """时序数据重采样"""
    if "timestamp" not in df.columns:
        return df
    try:
        df = df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.set_index("timestamp")
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            df = df[numeric_cols].resample(freq).mean().dropna()
        return df
    except Exception:
        return df
