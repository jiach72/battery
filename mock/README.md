# Mock Data Simulators

电池健康管理平台数据模拟器，用于开发阶段生成测试数据。

## 使用流程

1. 初始化拓扑: `python mock_topology.py`
2. 生成时序数据: `python mock_battery_data.py`
3. 生成告警事件: `python mock_alarm_events.py`
4. 模拟MQTT上报: `python mock_mqtt_publisher.py` (需要 Mosquitto 运行)

## Docker 一键执行

```bash
docker-compose run mock-data
```

## 数据格式

所有输出为 JSON 格式，可直接导入各数据库。
