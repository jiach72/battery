"""Airflow DAG - 每日凌晨析锂检测"""
import os
from datetime import datetime, timedelta
from config import ALGORITHM_BASE_URL

default_args = {
    "owner": "battery-platform",
    "depends_on_past": False,
    "start_date": datetime(2025, 1, 1),
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


def create_dag():
    try:
        from airflow import DAG
        from airflow.operators.python import PythonOperator

        with DAG("daily_lithium_detection", default_args=default_args,
                 schedule_interval="0 2 * * *", catchup=False) as dag:

            def run_lithium_detection(**kwargs):
                import requests
                response = requests.post(f"{ALGORITHM_BASE_URL}/algo/lithium-plating/detect",
                                         json={"cell_ids": ["all"], "date_range": "yesterday"},
                                         headers={"X-Internal-Token": os.getenv("ALGO_INTERNAL_API_KEY", "")},
                                         timeout=120)
                response.raise_for_status()
                return response.json()

            detect_task = PythonOperator(task_id="lithium_detection", python_callable=run_lithium_detection)
            return dag
    except ImportError:
        return None


dag = create_dag()
