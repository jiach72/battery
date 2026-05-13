# 电池健康管理平台 - 部署运维手册

## 1. 环境要求

### 基础设施
- **OS**: Ubuntu 22.04 LTS / 统信 UOS V20（信创适配）
- **Docker**: 24.0+
- **Docker Compose**: v2.20+
- **内存**: 最低 16GB（推荐 32GB，算法训练需 64GB+）
- **磁盘**: 最低 100GB（InfluxDB 时序数据建议独立 SSD 挂载）
- **GPU**: 算法训练需 NVIDIA GPU + CUDA 11.8+（推理可纯 CPU）

### 端口规划
| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx | 80/443 | 前端静态托管 + API 反代 |
| Spring Gateway | 8080 | 统一入口 |
| API Service | 8081 | 后端 API |
| Algorithm Service | 8000 | 算法引擎 |
| MySQL | 3306 | 关系数据 |
| Neo4j | 7474/7687 | 图数据 |
| InfluxDB | 8086 | 时序数据 |
| Redis | 6379 | 缓存 |
| Kafka | 9092 | 消息队列 |
| Mosquitto | 1883 | MQTT Broker |
| Airflow Webserver | 8088 | 调度面板 |

## 2. 快速部署（Docker Compose）

### 2.1 开发环境

```bash
# 克隆仓库
git clone <repo-url> && cd battery

# 启动所有服务
cd docker
docker-compose up -d

# 等待服务就绪（约60秒）
docker-compose ps

# 初始化数据库
docker-compose exec api-service java -jar app.jar --init-db

# 生成 Mock 数据
docker-compose exec algorithm python -m mock.mock_topology
docker-compose exec algorithm python -m mock.mock_battery_data
```

### 2.2 生产环境

生产环境使用 `docker/docker-compose.prod.yml`，核心约定如下：

- 生产环境禁用 demo 登录和 demo 数据
- 前端只暴露 80/443，后端和算法服务只走内网网络
- 网关、API、算法都要有健康检查
- 所有密码、JWT、MQTT、算法内网密钥通过环境变量或 Secret 注入

启动示例：

```bash
cd docker
cp .env.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

当前仓库仍建议先按 MVP 演示部署验证链路，再切生产配置。

## 3. 数据库初始化

### 3.1 MySQL

```bash
# 自动执行 backend/sql/mysql-schema.sql
# 兼容达梦/人大金仓方言，使用 JPA 方言抽象层
docker-compose exec mysql mysql -uroot -p<battery_2024> battery < /docker-entrypoint-initdb.d/init.sql
```

### 3.2 Neo4j

```bash
# 执行 Cypher 建图脚本
docker-compose exec neo4j cypher-shell -u neo4j -p<battery_neo4j> < /backend/sql/neo4j-schema.cypher
```

### 3.3 InfluxDB

```bash
# 执行 Flux 初始化脚本（创建 bucket + retention policy + 降采样 Task）
docker-compose exec influxdb influx query /backend/sql/influxdb-setup.flux
```

## 4. SSL/TLS 配置

### 4.1 Cloudflare 代理模式

域名通过 Cloudflare 代理，SSL/TLS 模式为 **Full**：
- Cloudflare ↔ 浏览器：Cloudflare 托管证书
- Cloudflare → 源服务器：自签证书

### 4.2 自签证书

```bash
# 生成自签证书
mkdir -p ./certs
openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout ./certs/server.key \
  -out ./certs/server.crt \
  -subj "/CN=*.thny.sg"

# Nginx 挂载证书
# docker-compose.yml 中已配置: ./certs:/etc/nginx/certs:ro
```

## 5. 算法引擎运维

### 5.1 模型训练

```bash
# SOH 模型训练（GPU 推荐）
docker-compose exec algorithm python -m algorithm.training.train_soh

# 析锂 Isolation Forest 训练
docker-compose exec algorithm python -m algorithm.training.train_isolation_forest

# SOM 一致性模型训练
docker-compose exec algorithm python -m algorithm.training.train_som
```

### 5.2 Airflow 调度

```bash
# 访问 Airflow Web UI: http://localhost:8088
# 默认账号: airflow / airflow

# DAG 列表：
# - dag_daily_lithium: 每日凌晨析锂检测
# - dag_daily_consistency: 每日一致性评分
# - dag_weekly_soh: 每周 SOH 重训练
```

### 5.3 训练/推理分离

- 训练产出模型文件存 `algorithm/trained_models/{module}/{version}/`
- 推理 API 自动加载最新版本模型
- 支持版本回滚：修改 `model_loader.py` 中版本号

## 6. 告警引擎

### 6.1 全链路

```
算法输出 → Kafka alarm topic → AlarmConsumer → 规则匹配(Redis alarm_rule:) → MySQL持久化 → WebSocket推送前端
```

### 6.2 WebSocket 降级

前端 `useWebSocket` Hook 内置降级策略：
1. 自动重连（指数退避，最大30s）
2. 3次重连失败后降级为 HTTP 轮询
3. WebSocket 恢复后自动切回

## 7. 信创适配

### 7.1 数据库兼容

- MySQL JPA 方言使用兼容模式（避免 `AUTO_INCREMENT` 等闭源方言）
- SQL 脚本提供达梦/人大金仓兼容注释
- `application.yml` 中配置 `spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect`

### 7.2 操作系统

- 兼容统信 UOS V20
- Docker 镜像基于 `openjdk:17-slim`（非 Oracle JDK）
- Python 镜像基于 `python:3.9-slim`

## 8. 监控与可观测性

### 8.1 健康检查

```bash
# Gateway 健康检查
curl http://localhost:8080/actuator/health

# Algorithm Service 健康检查
curl http://localhost:8000/health
```

### 8.2 日志

```bash
# 查看后端日志
docker-compose logs -f api-service

# 查看算法引擎日志
docker-compose logs -f algorithm

# 查看告警引擎日志
docker-compose logs -f api-service | grep -i alarm
```

## 11. 生产推进建议

- 生产版与演示版分文件维护，不共用启动参数
- 上线前先在演示环境跑完一轮全链路验收
- 算法服务、API Service、Gateway 的健康检查必须通过后再放量

## 9. 备份与恢复

### 9.1 MySQL 备份

```bash
docker-compose exec mysql mysqldump -uroot -p<battery_2024> battery > backup_$(date +%Y%m%d).sql
```

### 9.2 InfluxDB 备份

```bash
docker-compose exec influxdb influx backup /tmp/backup -b battery_measure
docker cp influxdb:/tmp/backup ./influxdb_backup_$(date +%Y%m%d)
```

### 9.3 Neo4j 备份

```bash
docker-compose exec neo4j neo4j-admin database dump neo4j --to=/tmp/neo4j.dump
docker cp neo4j:/tmp/neo4j.dump ./neo4j_backup_$(date +%Y%m%d).dump
```

## 10. 常见问题

### Q: InfluxDB 查询慢？
A: 检查降采样 Task 是否正常运行，使用对应粒度的 bucket 查询。

### Q: 算法训练 OOM？
A: 增大 Docker 内存限制，或降低 `batch_size` 参数。

### Q: WebSocket 连接断开？
A: 检查 Nginx WebSocket 代理配置，确认 `proxy_set_header Upgrade` 已设置。

### Q: MQTT 桥接数据不流通？
A: 检查 Mosquitto Broker 状态、Kafka topic 是否创建、bridge 服务日志。
