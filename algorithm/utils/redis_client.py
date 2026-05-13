"""Redis缓存工具 - 含四前缀操作"""
import os
import json
import threading
import redis

_pool_lock = threading.Lock()
_pool: redis.ConnectionPool | None = None


def _get_pool() -> redis.ConnectionPool:
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = redis.ConnectionPool(
                    host=os.getenv("REDIS_HOST", "localhost"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    decode_responses=True,
                )
    return _pool


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=_get_pool())


class RedisHelper:
    """四前缀操作封装: rt_measure / ledger_cache / alarm_rule / analog_map"""

    def __init__(self):
        self.r = get_redis()

    def set_rt_measure(self, station_id: str, unit_id: str, cell_data: dict, ttl: int = 60):
        key = f"rt_measure:{station_id}:{unit_id}"
        for cell_id, data in cell_data.items():
            self.r.hset(key, cell_id, json.dumps(data))
        self.r.expire(key, ttl)

    def get_rt_measure(self, station_id: str, unit_id: str) -> dict:
        key = f"rt_measure:{station_id}:{unit_id}"
        data = self.r.hgetall(key)
        return {k: json.loads(v) for k, v in data.items()}

    def set_ledger(self, entity_type: str, entity_id: str, data: dict, ttl: int = 3600):
        key = f"ledger_cache:{entity_type}:{entity_id}"
        self.r.hset(key, mapping=data)
        self.r.expire(key, ttl)

    def set_alarm_rule(self, rule_id: str, data: dict):
        key = f"alarm_rule:{rule_id}"
        self.r.hset(key, mapping=data)

    def get_alarm_rule(self, rule_id: str) -> dict:
        return self.r.hgetall(f"alarm_rule:{rule_id}")

    def set_analog_map(self, station_id: str, mapping: dict):
        key = f"analog_map:{station_id}"
        self.r.hset(key, mapping=mapping)

    def get_analog_map(self, station_id: str) -> dict:
        return self.r.hgetall(f"analog_map:{station_id}")
