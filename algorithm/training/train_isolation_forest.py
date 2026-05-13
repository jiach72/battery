"""析锂Isolation Forest训练"""
import os
import logging
import pickle

logger = logging.getLogger(__name__)


def train_isolation_forest(data_path: str = None, output_dir: str = "trained_models/lithium/v1"):
    """训练Isolation Forest模型"""
    os.makedirs(output_dir, exist_ok=True)
    from sklearn.ensemble import IsolationForest
    model = IsolationForest(contamination=0.05, random_state=42)
    model_path = os.path.join(output_dir, "isolation_forest.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    return {"model_path": model_path}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_isolation_forest()
