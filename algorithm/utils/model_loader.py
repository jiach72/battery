"""模型加载/版本管理工具"""
import os
import glob
import logging
import joblib

logger = logging.getLogger(__name__)

MODEL_BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "trained_models")


def get_latest_model_path(module: str) -> str:
    """获取最新版本模型路径"""
    module_dir = os.path.join(MODEL_BASE_DIR, module)
    if not os.path.exists(module_dir):
        raise FileNotFoundError(f"No models found for module: {module}")
    versions = sorted(os.listdir(module_dir))
    if not versions:
        raise FileNotFoundError(f"No model versions found for module: {module}")
    return os.path.join(module_dir, versions[-1])


def load_pickle_model(module: str, filename: str = None):
    """加载pickle格式的模型"""
    model_path = get_latest_model_path(module)
    if filename:
        model_path = os.path.join(model_path, filename)
    else:
        pkl_files = glob.glob(os.path.join(model_path, "*.pkl"))
        if not pkl_files:
            raise FileNotFoundError(f"No .pkl model files in {model_path}")
        model_path = pkl_files[0]
    with open(model_path, "rb") as f:
        return joblib.load(f)


def load_torch_model(module: str, filename: str = "model.pt"):
    """加载PyTorch模型"""
    import torch
    model_path = os.path.join(get_latest_model_path(module), filename)
    return torch.load(model_path, map_location="cpu", weights_only=True)
