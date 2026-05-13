"""告警事件生成器"""
import json
import random
import uuid
from datetime import datetime, timedelta


def generate_alarm_events(count: int = 50):
    """生成模拟告警事件"""
    severities = ["high", "medium", "low"]
    risk_types = ["capacity_risk", "volt_risk", "short_circuit_risk", "temp_risk", "liout_risk"]
    devices = [f"cell-1-1-1-{i}-{j}" for i in range(1, 5) for j in range(1, 27)]

    events = []
    for _ in range(count):
        severity = random.choice(severities)
        risk_type = random.choice(risk_types)
        device = random.choice(devices)
        events.append({
            "id": str(uuid.uuid4()),
            "ruleId": f"rule-{random.randint(1, 10)}",
            "ruleName": f"{risk_type.replace('_', ' ')} alert",
            "severity": severity,
            "deviceId": device,
            "deviceName": f"Cell {device.split('-')[-1]}",
            "description": f"{risk_type} detected on {device}",
            "condition": f"{risk_type} > threshold",
            "triggerValue": round(random.uniform(0.5, 2.0), 3),
            "threshold": 1.0,
            "status": random.choice(["UNACK", "ACKED", "RESOLVED"]),
            "createdAt": (datetime.now() - timedelta(hours=random.randint(0, 72))).isoformat(),
        })

    return events


if __name__ == "__main__":
    events = generate_alarm_events()
    with open("mock_alarm_events.json", "w") as f:
        json.dump(events, f, indent=2)
    print(f"Generated {len(events)} alarm events")
