"""SOM网络训练"""
import os
import logging
import pickle

logger = logging.getLogger(__name__)


def train_som(data_path: str = None, output_dir: str = "trained_models/consistency/v1",
              grid_size: int = 10):
    """训练SOM网络"""
    os.makedirs(output_dir, exist_ok=True)
    from minisom import MiniSom
    som = MiniSom(grid_size, grid_size, 3, sigma=1.0, learning_rate=0.5)
    model_path = os.path.join(output_dir, "som.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(som, f)
    return {"model_path": model_path}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_som()
