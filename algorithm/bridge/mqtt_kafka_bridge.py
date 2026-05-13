"""MQTT→Kafka 数据桥接 - 安全II/III区数据穿透"""
import json
import logging
import os

import paho.mqtt.client as mqtt
from kafka import KafkaProducer
from config import MQTT_CONFIG

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
MQTT_BROKER = MQTT_CONFIG["broker"]
MQTT_PORT = MQTT_CONFIG["port"]
MQTT_TOPIC = os.getenv("MQTT_TOPIC", f'{MQTT_CONFIG["topic_prefix"]}#')


class MqttKafkaBridge:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        self.mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        self.mqtt_client.on_message = self._on_message

    def _on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode("utf-8"))
            topic = msg.topic.replace("/", "-")
            self.producer.send(f"bms-{topic}", data)
            logger.info(f"Bridged MQTT {msg.topic} -> Kafka bms-{topic}")
        except Exception as e:
            logger.error(f"Bridge error: {e}")

    def start(self):
        self.mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        self.mqtt_client.subscribe(MQTT_TOPIC)
        logger.info(f"MQTT-Kafka bridge started: {MQTT_BROKER}:{MQTT_PORT} -> {KAFKA_BOOTSTRAP}")
        self.mqtt_client.loop_forever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    bridge = MqttKafkaBridge()
    bridge.start()
