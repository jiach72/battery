"""多数据库连接器"""
import os
import threading
from influxdb_client import InfluxDBClient
from neo4j import GraphDatabase
import redis
import pymysql

_influx_lock = threading.Lock()
_influx_client: InfluxDBClient | None = None

_neo4j_lock = threading.Lock()
_neo4j_driver = None

_redis_lock = threading.Lock()
_redis_client: redis.Redis | None = None


def get_influx_client() -> InfluxDBClient:
    global _influx_client
    if _influx_client is None:
        with _influx_lock:
            if _influx_client is None:
                _influx_client = InfluxDBClient(
                    url=os.getenv("INFLUXDB_URL", "http://localhost:8086"),
                    token=os.getenv("INFLUXDB_TOKEN", ""),
                    org=os.getenv("INFLUXDB_ORG", "battery"),
                )
    return _influx_client


def get_neo4j_driver():
    global _neo4j_driver
    if _neo4j_driver is None:
        with _neo4j_lock:
            if _neo4j_driver is None:
                _neo4j_driver = GraphDatabase.driver(
                    os.getenv("NEO4J_URI", "bolt://localhost:7687"),
                    auth=(os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASSWORD", "")),
                )
    return _neo4j_driver


def get_redis_client():
    global _redis_client
    if _redis_client is None:
        with _redis_lock:
            if _redis_client is None:
                _redis_client = redis.Redis(
                    host=os.getenv("REDIS_HOST", "localhost"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    decode_responses=True,
                )
    return _redis_client


def get_mysql_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DB", "battery_platform"),
    )
