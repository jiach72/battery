"""边缘网关DCIR切片接收处理"""
import logging
import numpy as np

logger = logging.getLogger(__name__)


def handle_dcir_slice(slice_data: dict) -> dict:
    """处理边缘网关上传的DCIR切片数据 - 边缘检测电流梯度>阈值 -> 截取高频切片 -> HTTP POST上传"""
    cell_id = slice_data.get("cell_id")
    current_data = slice_data.get("current_data", [])
    voltage_data = slice_data.get("voltage_data", [])

    if len(current_data) < 10 or len(voltage_data) < 10:
        return {"error": "Insufficient data points"}

    from advanced.dcir_estimator import estimate_dcir
    result = estimate_dcir({
        "cell_id": cell_id,
        "current_data": current_data,
        "voltage_data": voltage_data,
    })

    logger.info(f"DCIR estimated for {cell_id}: {result.get('dcir_value')} Ohm")
    return result
