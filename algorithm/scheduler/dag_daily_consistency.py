"""Airflow DAG - 每日一致性评分"""
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

        with DAG("daily_consistency_score", default_args=default_args,
                 schedule_interval="0 3 * * *", catchup=False) as dag:

            def run_consistency_score(**kwargs):
                import requests
                response = requests.post(f"{ALGORITHM_BASE_URL}/algo/consistency/score",
                                         json={"cluster_id": "all", "metric_type": "voltage"},
                                         headers={"X-Internal-Token": os.getenv("ALGO_INTERNAL_API_KEY", "")},
                                         timeout=120)
                response.raise_for_status()
                return response.json()

            score_task = PythonOperator(task_id="consistency_score", python_callable=run_consistency_score)
            return dag
    except ImportError:
        return None


dag = create_dag()
