# MVP 服务器演示部署

> 目标：用现有版本快速部署一个可给客户演示的 MVP。

## 1. 推荐方式

前端使用 Nginx 静态托管，后端通过 Docker Compose 起服务，演示优先启用 demo 数据，不接真实设备。

如果要推生产环境，请改用 [docs/deployment.md](deployment.md) 中的生产约定和 `docker/docker-compose.prod.yml`。

## 2. 服务器准备

- Ubuntu 22.04+
- Docker 24+
- Docker Compose v2
- 16GB+ 内存
- 100GB+ 磁盘

## 3. 准备配置

```powershell
cd docker
copy .env.example .env
```

把 `.env` 里的这些值改掉：

- `MYSQL_ROOT_PASSWORD`
- `NEO4J_AUTH`
- `NEO4J_PASSWORD`
- `INFLUXDB_ADMIN_PASSWORD`
- `INFLUXDB_ADMIN_TOKEN`
- `JWT_SECRET`
- `ALGORITHM_ENGINE_API_KEY`
- `ALGO_INTERNAL_API_KEY`

演示版本建议：

- `AUTH_DEMO_ENABLED=true`
- `DEMO_DATA_ENABLED=true`
- `ALGO_CORS_ORIGINS=http://<server-ip>`
- `GATEWAY_CORS_ORIGINS=http://<server-ip>`

如果这台服务器已经被别的站点占用了 80 端口，改用 `docker/.env.demo.example`，把 `WEB_HOST_PORT=3010` 之类的端口固定下来，再让 nginx 子域名反代到这个端口。

## 4. 启动命令

只起 MVP 演示所需服务，不启 MQTT 设备链路：

```bash
docker compose up -d --build mysql neo4j influxdb redis kafka zookeeper gateway api-service algorithm web
```

生产环境不要直接复用演示 `.env`，请复制 `docker/.env.example` 并把 `AUTH_DEMO_ENABLED`、`DEMO_DATA_ENABLED` 保持为 `false`。

如果后面要接真实设备，再单独启动：

```bash
docker compose up -d mosquitto mqtt-bridge
```

### GitHub Actions 部署

如果仓库已经推到 GitHub，可以用 `deploy-demo.yml` 自动同步到服务器，不影响其他项目：

- `DEPLOY_HOST`：服务器 IP 或域名
- `DEPLOY_USER`：SSH 用户名，例如 `ubuntu`
- `DEPLOY_SSH_KEY`：用于登录服务器的私钥内容

部署目标固定为 `/opt/battery-demo`，容器项目名固定为 `battery-demo`，`battery.scdc.cloud` 只会指向这套 demo 的 `127.0.0.1:3010`。

建议演示前先确认镜像已经构建成功：

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f gateway
docker compose logs -f api-service
docker compose logs -f algorithm
```

## 5. 访问地址

- 前端演示页：`http://<server-ip>/`
- API 反代：`http://<server-ip>/api/v1/...`
- 如果用了子域名反代：`https://battery.scdc.cloud/`

## 6. 演示检查

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f gateway
docker compose logs -f api-service
curl http://127.0.0.1:8080/actuator/health
curl http://127.0.0.1:8081/actuator/health
curl http://127.0.0.1:8000/health
```

## 7. 建议的演示模式

- 用 demo 登录（账号密码来自 `.env`）
- 用 demo 数据展示驾驶舱、告警、问诊室、算法目录和版本对比
- 设备接入先讲架构和点表，不在这版里强行连客户现场设备

## 8. 上线注意

- 这是一版 MVP 演示，不是最终生产版
- 演示服务器建议只对外开放 80/443
- 真接设备前，要补 MQTT 鉴权和点表映射
- 若要做最终生产交付，再切回设备接入和安全加固
