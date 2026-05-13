# 客户设备接入模板

> 目标：给客户现场联调时直接使用，避免临时口头对齐。

## 1. 主数据模板

| 字段 | 示例 | 说明 |
|---|---|---|
| tenant_id | cust-a | 客户/租户标识 |
| station_id | station-001 | 站点标识 |
| energy_unit_id | eu-01 | 储能单元标识 |
| cluster_id | cluster-04 | 电池簇标识 |
| cell_id | cell-04-12 | 单体标识 |
| protocol | modbus-tcp | 协议类型 |
| gateway_id | gw-01 | 边缘网关标识 |
| sampling_period_ms | 1000 | 采样周期 |
| enabled | true | 是否启用 |

## 2. 测点模板

| point_code | point_name | data_type | unit | address | scale |
|---|---|---|---|---|---|
| V_CELL | 单体电压 | voltage | V | 40001 | 0.001 |
| I_CELL | 采样电流 | current | A | 40002 | 0.1 |
| T_CELL | 单体温度 | temperature | ℃ | 40003 | 0.1 |
| SOC_CELL | 荷电状态 | soc | % | 40004 | 0.1 |
| SOH_CELL | 健康状态 | soh | % | 40005 | 0.1 |

## 3. 统一遥测样例

```json
{
  "tenant_id": "cust-a",
  "station_id": "station-001",
  "energy_unit_id": "eu-01",
  "cluster_id": "cluster-04",
  "cell_id": "cell-04-12",
  "ts": "2026-05-12T10:00:00+08:00",
  "metrics": {
    "voltage": 3.21,
    "current": 52.4,
    "temperature": 28.6,
    "soc": 82.1,
    "soh": 94.8
  },
  "quality": {
    "valid": true,
    "source": "gw-01",
    "seq": 9912
  }
}
```

## 4. MQTT Topic

- `battery/{station_id}/{energy_unit_id}/{cluster_id}/{cell_id}`

示例：

- `battery/station-001/eu-01/cluster-04/cell-04-12`

## 5. 联调步骤

1. 导入站点、单元、簇、单体主数据。
2. 先核对点表和单位，再接协议。
3. 用单条遥测样例做字段校验。
4. 连续跑 24 小时看丢包、乱序和延迟。
5. 再打开告警和算法回写。

## 6. 客户需要提供

- 设备厂家和型号
- 协议文档
- 点表导出
- 采样周期
- 站点命名规则
- 允许开放的端口和白名单
- 是否允许双向控制
