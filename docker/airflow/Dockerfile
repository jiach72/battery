FROM apache/airflow:2.8.1

USER root
RUN apt-get update && apt-get install -y python3-pip && rm -rf /var/lib/apt/lists/*
USER airflow

# 注意: 需要在 docker/ 目录下构建，context 设为项目根目录
# docker build -f docker/airflow/Dockerfile -t battery-airflow ..
COPY algorithm/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
