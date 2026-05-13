"""电池时序数据生成器"""
import json
import random
from datetime import datetime, timedelta


def generate_battery_data(cell_ids: list, hours: int = 24, interval_seconds: int = 5):
    """生成电池时序量测数据"""
    data = []
    start_time = datetime.now() - timedelta(hours=hours)

    for cell_id in cell_ids:
        base_voltage = 3.3 + random.uniform(-0.1, 0.1)
        base_temp = 27 + random.uniform(-2, 2)
        base_soc = random.uniform(40, 80)
        is_charging = random.random() > 0.5

        current_time = start_time
        while current_time <= datetime.now():
            soc_delta = 0.01 if is_charging else -0.01
            base_soc = max(10, min(100, base_soc + soc_delta))
            voltage = base_voltage + (base_soc / 100) * 0.4 + random.uniform(-0.005, 0.005)
            current = random.uniform(30, 70) * (1 if is_charging else -1)
            temperature = base_temp + random.uniform(-0.5, 0.5)

            data.append({
                "cell_id": cell_id,
                "timestamp": current_time.isoformat(),
                "voltage": round(voltage, 4),
                "current": round(current, 2),
                "temperature": round(temperature, 1),
                "soc": round(base_soc, 2),
            })
            current_time += timedelta(seconds=interval_seconds)

    return data


if __name__ == "__main__":
    cells = [f"cell-1-1-1-1-{i}" for i in range(1, 27)]
    data = generate_battery_data(cells, hours=1, interval_seconds=10)
    with open("mock_battery_data.json", "w") as f:
        json.dump(data[:1000], f, indent=2)
    print(f"Generated {len(data)} data points")
