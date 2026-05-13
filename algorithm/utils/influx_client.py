"""InfluxDB读写工具"""
import os
import re
import threading
from influxdb_client import InfluxDBClient, Point, WriteAPI, QueryAPI
from influxdb_client.client.write_api import SYNCHRONOUS

_FLUX_SAFE = re.compile(r'^[a-zA-Z0-9_./-]+$')

_client_lock = threading.Lock()
_client: InfluxDBClient | None = None


def _get_client() -> InfluxDBClient:
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = InfluxDBClient(
                    url=os.getenv("INFLUXDB_URL", "http://localhost:8086"),
                    token=os.getenv("INFLUXDB_TOKEN", ""),
                    org=os.getenv("INFLUXDB_ORG", "battery"),
                )
    return _client


def get_write_api() -> WriteAPI:
    return _get_client().write_api(write_options=SYNCHRONOUS)


def get_query_api() -> QueryAPI:
    return _get_client().query_api()


def _validate_flux_literal(value: str, name: str) -> None:
    if not _FLUX_SAFE.match(value):
        raise ValueError(f"Invalid {name}: {value!r} contains disallowed characters")


def write_measurements(bucket: str, records: list):
    """批量写入时序量测数据"""
    write_api = get_write_api()
    points = []
    for r in records:
        p = Point(r["measurement"]) \
            .tag("station_id", r.get("station_id", "")) \
            .tag("cell_id", r.get("cell_id", "")) \
            .field("voltage", r.get("voltage", 0)) \
            .field("current", r.get("current", 0)) \
            .field("temperature", r.get("temperature", 0)) \
            .field("soc", r.get("soc", 0))
        points.append(p)
    write_api.write(bucket=bucket, record=points)


def query_measurements(bucket: str, measurement: str, time_range: str = "-1h",
                        filters: dict = None) -> list:
    """查询时序量测数据"""
    _validate_flux_literal(bucket, "bucket")
    _validate_flux_literal(measurement, "measurement")
    query_api = get_query_api()
    flux = f'from(bucket: "{bucket}") |> range(start: {time_range}) |> filter(fn: (r) => r._measurement == "{measurement}")'
    if filters:
        for k, v in filters.items():
            _validate_flux_literal(k, "filter key")
            _validate_flux_literal(str(v), "filter value")
            flux += f' |> filter(fn: (r) => r.{k} == "{v}")'
    tables = query_api.query(flux)
    results = []
    for table in tables:
        for record in table.records:
            results.append(record.values)
    return results
