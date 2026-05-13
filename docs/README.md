# Battery Health Management Platform

电池健康管理 SaaS 平台 - 面向电化学储能电站的全生命周期健康管理。

## 架构

```
Frontend (React) → Gateway (Spring Cloud) → API Service (Spring Boot)
                                          → Algorithm Engine (Python FastAPI)
Storage: MySQL + Neo4j + InfluxDB + Redis
MQ: Kafka + Mosquitto (MQTT)
```

## 快速开始

### 前置条件
- Node.js 18+
- Java 17+
- Python 3.11+
- Docker & Docker Compose

### 启动基础设施

```bash
cd docker
docker-compose up -d mysql neo4j influxdb redis kafka zookeeper mosquitto
```

### 启动后端

```bash
cd backend
mvn spring-boot:run -pl gateway
mvn spring-boot:run -pl api-service
```

### 启动算法引擎

```bash
cd algorithm
pip install -r requirements.txt
uvicorn app:app --port 8000
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

## 项目结构

- `frontend/` - React 18 + Redux Toolkit + Ant Design + ECharts
- `backend/` - Spring Boot 3.x + Spring Cloud 微服务
- `algorithm/` - Python FastAPI 6大算法引擎
- `docker/` - Docker Compose 编排
- `mock/` - 数据模拟器
- `production-delivery-checklist.md` - 生产交付清单
- `customer-device-integration-spec.md` - 客户设备接入规范
- `mvp-deployment.md` - MVP 服务器演示部署

## 六大算法模块

1. SOH评估与寿命预测 (Transformer-LSTM + PINN)
2. 微短路检测 (Pseudo-OCV + RLMQD)
3. 析锂检测 (ICA/DVA + FPCA + Isolation Forest)
4. DCIR估算 (Thevenin ECM + RLS)
5. 一致性评分 (DBSCAN + SOM)
6. 运维调换优化 (MILP + 鲸鱼优化)

## Codex 记忆工作流

每个项目都有自己的 `wing`。进入仓库后，先看一眼这个项目的记忆摘要：

```powershell
.\scripts\codex-prep.ps1
```

如果你在子目录里执行，它会自动往上找最近的 `mempalace.yaml`，再按对应 `wing` 取摘要。这样不同项目不会混在一起。
