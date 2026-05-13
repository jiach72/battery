"""收益预测汇总"""
import pandas as pd
import numpy as np


def calculate_revenue_forecast(df: pd.DataFrame, electricity_price: float = 0.8,
                                discharge_price: float = 1.0) -> dict:
    """收益预测"""
    if "delta_ah" not in df.columns:
        return {"forecast_profit_month": 0, "revenue_today": 0}

    discharge_kwh = abs(df[df["state"] == "DISCHARGE"]["delta_ah"].sum()) / 1000 * 3.2
    charge_kwh = abs(df[df["state"] == "CHARGE"]["delta_ah"].sum()) / 1000 * 3.2

    revenue_today = discharge_kwh * discharge_price - charge_kwh * electricity_price
    forecast_profit_month = revenue_today * 30

    return {
        "revenue_today": round(revenue_today, 2),
        "forecast_profit_month": round(forecast_profit_month, 2),
    }
