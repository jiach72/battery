"""Airflow DAG - 每周SOH重训练"""
from datetime import datetime, timedelta

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

        with DAG("weekly_soh_retrain", default_args=default_args,
                 schedule_interval="0 4 * * 1", catchup=False) as dag:

            def run_soh_retrain(**kwargs):
                import subprocess
                subprocess.run(["python", "training/train_soh.py"], check=True)
                return {"status": "completed"}

            retrain_task = PythonOperator(task_id="soh_retrain", python_callable=run_soh_retrain)
            return dag
    except ImportError:
        return None


dag = create_dag()
