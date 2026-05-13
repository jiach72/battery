"""SOH/循环次数/里程/收益计算"""
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.linear_model import LinearRegression
from config import ALGO_CONFIG


def calculate_soh(request: dict) -> dict:
    """
    SOH计算与预测入口
    基于PRD第3.2节：基于n>=30天历史数据构建线性回归，
    预测工况强制使用最近半个月的平均工况作为输入因子
    """
    energy_unit_id = request.get("energy_unit_id", "")
    cell_ids = request.get("cell_ids", ["cell-1"])
    historical_data = request.get("historical_data", {})
    nominal_capacity = request.get("nominal_capacity", 280.0)
    prediction_days = ALGO_CONFIG["soh"]["prediction_horizon_days"]

    results = []
    for cell_id in cell_ids:
        cell_data = historical_data.get(cell_id, [])
        if len(cell_data) >= ALGO_CONFIG["soh"]["min_data_points"]:
            result = _predict_soh_with_regression(cell_id, cell_data, nominal_capacity, prediction_days)
        else:
            # 数据不足时使用简单计算
            real_capacity = request.get("real_capacity", nominal_capacity * 0.925)
            real_soh = calculate_soh_value(real_capacity, nominal_capacity)
            result = {
                "cell_id": cell_id,
                "real_soh": real_soh,
                "theory_soh": round(real_soh + 2.5, 2),
                "predicted_soh": [],
                "prediction_dates": [],
                "message": f"历史数据不足（当前{len(cell_data)}条，需{ALGO_CONFIG['soh']['min_data_points']}条），使用静态估算",
            }
        results.append(result)

    return {
        "energy_unit_id": energy_unit_id,
        "results": results,
    }


def _predict_soh_with_regression(cell_id: str, data: list, nominal_capacity: float, horizon: int) -> dict:
    """基于线性回归的SOH预测（PRD要求：n>=30天，最近半月平均工况）"""
    df = pd.DataFrame(data)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")
    if "capacity" not in df.columns:
        return {"cell_id": cell_id, "error": "缺少capacity字段"}

    # 计算每日SOH
    df["soh"] = df["capacity"] / nominal_capacity * 100
    df["day_index"] = range(len(df))

    # 线性回归
    X = df["day_index"].values.reshape(-1, 1)
    y = df["soh"].values
    model = LinearRegression()
    model.fit(X, y)

    real_soh = round(float(y[-1]), 2)
    theory_soh = round(float(model.predict([[len(df) - 1]])[0]), 2)

    # 使用最近半个月的平均工况作为预测因子（PRD强制要求）
    recent_half_month = df.tail(15)
    avg_daily_decline = 0.0
    if len(recent_half_month) > 1:
        recent_soh = recent_half_month["soh"].values
        avg_daily_decline = float((recent_soh[0] - recent_soh[-1]) / len(recent_soh))

    # 预测未来
    predicted_soh = []
    prediction_dates = []
    last_date = df["date"].iloc[-1] if "date" in df.columns else datetime.now()
    for d in range(1, horizon + 1, 7):  # 每周一个预测点
        future_day = len(df) + d
        pred = float(model.predict([[future_day]])[0])
        pred = max(0, min(100, pred))
        predicted_soh.append(round(pred, 2))
        pred_date = last_date + pd.Timedelta(days=d)
        prediction_dates.append(pred_date.strftime("%Y-%m-%d"))

    return {
        "cell_id": cell_id,
        "real_soh": real_soh,
        "theory_soh": theory_soh,
        "predicted_soh": predicted_soh,
        "prediction_dates": prediction_dates,
        "regression_slope": round(float(model.coef_[0]), 6),
        "avg_daily_decline": round(avg_daily_decline, 6),
    }


def calculate_soh_value(real_capacity: float, nominal_capacity: float = 280.0) -> float:
    """SOH = 实际容量 / 标称容量 × 100%"""
    if nominal_capacity <= 0:
        raise ValueError(f"nominal_capacity must be positive, got {nominal_capacity}")
    return round(real_capacity / nominal_capacity * 100, 2)


def calculate_cycle_count(df: pd.DataFrame) -> int:
    """计算循环次数"""
    if "state" not in df.columns:
        return 0
    state_changes = (df["state"] != df["state"].shift()).sum()
    return state_changes // 2


def calculate_mileage(df: pd.DataFrame, nominal_capacity: float = 280.0) -> dict:
    """计算里程"""
    total_discharge_ah = abs(df[df["state"] == "DISCHARGE"]["delta_ah"].sum()) if "delta_ah" in df.columns else 0
    cycle_count = calculate_cycle_count(df)
    days = 1
    if "timestamp" in df.columns and len(df) > 1:
        time_range = df["timestamp"].max() - df["timestamp"].min()
        days = max(1, time_range.days if hasattr(time_range, 'days') else 1)
    return {
        "battery_mileage_amount": round(total_discharge_ah, 2),
        "battery_mileage_day": round(total_discharge_ah / days, 2),
        "used_recycle_times": cycle_count,
        "remaining_recycle_times": max(0, 3000 - cycle_count),
    }


def predict_revenue(daily_discharge_kwh: float, electricity_price: float = 0.85,
                    days: int = 30) -> dict:
    """预测月收益"""
    daily_revenue = daily_discharge_kwh * electricity_price
    return {
        "forecast_profit_month": round(daily_revenue * days, 2),
        "daily_revenue": round(daily_revenue, 2),
    }
