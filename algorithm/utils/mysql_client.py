"""MySQL写入工具（连接池版本）"""
import os
import pymysql
from dbutils.pooled_db import PooledDB

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = PooledDB(
            creator=pymysql,
            maxconnections=10,
            mincached=2,
            host=os.getenv("MYSQL_HOST", "mysql"),
            port=int(os.getenv("MYSQL_PORT", 3306)),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DB", "battery_platform"),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
        )
    return _pool


def get_connection():
    return _get_pool().connection()


def insert_alarm_event(event: dict):
    """插入告警事件"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            sql = """INSERT INTO data_alarm_event 
                     (rule_id, rule_name, severity, device_id, device_name, description, 
                      condition_expr, trigger_value, threshold, status) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (
                event["rule_id"], event["rule_name"], event["severity"],
                event["device_id"], event["device_name"], event["description"],
                event.get("condition", ""), event.get("trigger_value", 0),
                event.get("threshold", 0), "UNACK",
            ))
        conn.commit()
