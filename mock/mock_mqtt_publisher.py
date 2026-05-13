"""MQTT 模拟上报"""
import json
import random
import time
from datetime import datetime

import paho.mqtt.client as mqtt

BROKER = "localhost"
PORT = 1883
TOPIC_PREFIX = "battery/station-1"


def publish_mock_data(duration_seconds: int = 60, interval: float = 1.0):
    """模拟采集数据 MQTT 上报"""
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.connect(BROKER, PORT, 60)
    client.loop_start()

    print(f"Publishing mock battery data to {BROKER}:{PORT}/{TOPIC_PREFIX}/*")
    start = time.time()

    try:
        while time.time() - start < duration_seconds:
            for cluster_no in range(1, 5):
                for cell_no in range(1, 27):
                    payload = {
                        "cell_id": f"cell-1-1-1-{cluster_no}-{cell_no}",
                        "timestamp": datetime.now().isoformat(),
                        "voltage": round(3.2 + random.uniform(0, 0.2), 4),
                        "current": round(random.uniform(-60, 60), 2),
                        "temperature": round(25 + random.uniform(0, 10), 1),
                        "soc": round(random.uniform(20, 100), 2),
                    }
                    topic = f"{TOPIC_PREFIX}/cluster-{cluster_no}/cell-{cell_no}"
                    client.publish(topic, json.dumps(payload))
            time.sleep(interval)
    except KeyboardInterrupt:
        pass
    finally:
        client.loop_stop()
        client.disconnect()
        print("Stopped publishing")


if __name__ == "__main__":
    publish_mock_data(duration_seconds=300, interval=2.0)
