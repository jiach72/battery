"""Kafka消费者封装"""
import json
import logging
import os
from kafka import KafkaConsumer

logger = logging.getLogger(__name__)


def create_consumer(topic: str, group_id: str = "battery-platform-algo") -> KafkaConsumer:
    return KafkaConsumer(
        topic,
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "localhost:9092").split(","),
        group_id=group_id,
        auto_offset_reset="earliest",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )


def consume_loop(topic: str, handler, group_id: str = "battery-platform-algo"):
    """消费循环"""
    consumer = create_consumer(topic, group_id)
    logger.info(f"Starting consumer for topic: {topic}")
    for message in consumer:
        try:
            handler(message.value)
        except Exception as e:
            logger.error(f"Error processing message: {e}")
