"""Pydantic 数据模型"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


def _first(data: dict, *keys: str, default=None):
    for key in keys:
        if key in data:
            value = data[key]
            if value not in (None, ""):
                return value
    return default


def _string_list(value, default: Optional[list[str]] = None) -> list[str]:
    if value is None:
        return list(default or [])
    if isinstance(value, list):
        return [str(item) for item in value if item not in (None, "")]
    return [str(value)]


def _numeric_list(value) -> list[float]:
    if value is None:
        return []
    if isinstance(value, dict):
        iterable = value.values()
    elif isinstance(value, (list, tuple, set)):
        iterable = value
    else:
        iterable = [value]

    result = []
    for item in iterable:
        try:
            result.append(float(item))
        except (TypeError, ValueError):
            continue
    return result


def _numeric_map(value) -> dict[str, float]:
    if value is None:
        return {}
    if isinstance(value, dict):
        normalized = {}
        for key, raw_value in value.items():
            try:
                normalized[str(key)] = float(raw_value)
            except (TypeError, ValueError):
                continue
        return normalized
    if not isinstance(value, list):
        return {}

    normalized = {}
    for index, item in enumerate(value):
        if not isinstance(item, dict):
            continue
        cell_id = item.get("cell_id") or item.get("cellId") or item.get("id") or f"cell-{index + 1}"
        soh = item.get("soh") if item.get("soh") is not None else item.get("value")
        if soh is None:
            continue
        try:
            normalized[str(cell_id)] = float(soh)
        except (TypeError, ValueError):
            continue
    return normalized


def _ensure_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


class APIModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class CellMeasure(APIModel):
    cell_id: str
    timestamp: str
    voltage: float
    current: float
    temperature: float
    soc: float


class SohPredictResult(APIModel):
    cell_id: str
    real_soh: float
    theory_soh: float
    predicted_soh: List[float] = Field(default_factory=list)
    prediction_dates: List[str] = Field(default_factory=list)
    regression_slope: Optional[float] = None
    avg_daily_decline: Optional[float] = None
    message: Optional[str] = None


class SohPredictRequest(APIModel):
    energy_unit_id: str = "eu-1"
    cell_ids: List[str] = Field(default_factory=list)
    prediction_days: int = 30
    historical_data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    real_capacity: Optional[float] = None
    nominal_capacity: float = 280.0

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        energy_unit_id = str(_first(data, "energy_unit_id", "energyUnitId", "deviceId", default="eu-1"))
        data["energy_unit_id"] = energy_unit_id

        cell_ids = _first(data, "cell_ids", "cellIds", "cellId")
        if cell_ids:
            data["cell_ids"] = _string_list(cell_ids)
        else:
            data["cell_ids"] = [energy_unit_id]

        data["prediction_days"] = int(_first(data, "prediction_days", "predictionDays", "horizonDays", default=30))
        data["historical_data"] = _first(data, "historical_data", "historicalData", default={})
        real_capacity = _first(data, "real_capacity", "realCapacity", default=None)
        data["real_capacity"] = None if real_capacity is None else float(real_capacity)
        data["nominal_capacity"] = float(_first(data, "nominal_capacity", "nominalCapacity", default=280.0))
        return data


class MicroShortCircuitRequest(APIModel):
    cell_ids: List[str] = Field(default_factory=list)
    voltage_data: Dict[str, List[float]] = Field(default_factory=dict)
    date_range: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        cells = _first(data, "cell_ids", "cellIds", "cellId", "deviceId")
        data["cell_ids"] = _string_list(cells) if cells else ["cell-1"]
        data["voltage_data"] = _first(data, "voltage_data", "voltageData", default={})
        data["date_range"] = _first(data, "date_range", "dateRange", default=None)
        return data


class MicroShortCircuitResponse(APIModel):
    cell_id: str
    is_short_circuit: bool
    residual_value: float
    threshold: float
    confidence: float
    voltage_5pct: Optional[float] = None
    voltage_mean: Optional[float] = None
    message: Optional[str] = None


class LithiumPlatingRequest(APIModel):
    cell_ids: List[str] = Field(default_factory=list)
    current_data: Dict[str, List[float]] = Field(default_factory=dict)
    voltage_data: Dict[str, List[float]] = Field(default_factory=dict)
    date_range: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        cells = _first(data, "cell_ids", "cellIds", "cellId", "deviceId")
        data["cell_ids"] = _string_list(cells) if cells else ["cell-1"]
        data["current_data"] = _first(data, "current_data", "currentData", default={})
        data["voltage_data"] = _first(data, "voltage_data", "voltageData", default={})
        data["date_range"] = _first(data, "date_range", "dateRange", default=None)
        return data


class LithiumPlatingResponse(APIModel):
    cell_id: str
    is_lithium_plating: bool
    ica_peak_shift: float
    anomaly_score: float
    peak_voltage: float
    confidence: Optional[float] = None
    message: Optional[str] = None


class DcirEstimateRequest(APIModel):
    cell_id: str = "cell-1"
    current_data: List[float] = Field(default_factory=list)
    voltage_data: List[float] = Field(default_factory=list)
    time_step: float = 1.0

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        data["cell_id"] = str(_first(data, "cell_id", "cellId", "deviceId", default="cell-1"))
        data["current_data"] = _numeric_list(_first(data, "current_data", "currentData", default=[]))
        data["voltage_data"] = _numeric_list(_first(data, "voltage_data", "voltageData", default=[]))
        data["time_step"] = float(_first(data, "time_step", "timeStep", default=1.0))
        return data


class DcirEstimateResponse(APIModel):
    cell_id: str
    dcir_value: float
    r0: float
    r1: float
    r2: float
    c1: float
    confidence: float
    health_indicator: float
    risk_level: str
    method: Optional[str] = None
    message: Optional[str] = None


class ImpedanceSpectrumPoint(APIModel):
    frequency_hz: float
    real_ohm: float
    imag_ohm: float


class ImpedanceSpectrumRequest(APIModel):
    cell_id: str = "cell-1"
    method: Optional[str] = None
    frequencies_hz: List[float] = Field(default_factory=list)
    real_ohm: List[float] = Field(default_factory=list)
    imag_ohm: List[float] = Field(default_factory=list)
    temperature: Optional[float] = None
    soc: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        data["cell_id"] = str(_first(data, "cell_id", "cellId", "deviceId", default="cell-1"))
        data["method"] = _first(data, "method", "algoMethod", default=None)
        data["frequencies_hz"] = _numeric_list(_first(data, "frequencies_hz", "frequenciesHz", "frequency", default=[]))
        data["real_ohm"] = _numeric_list(_first(data, "real_ohm", "realOhm", "zReal", default=[]))
        data["imag_ohm"] = _numeric_list(_first(data, "imag_ohm", "imagOhm", "zImag", default=[]))
        temp = _first(data, "temperature", "temp", default=None)
        soc = _first(data, "soc", "socValue", default=None)
        data["temperature"] = None if temp is None else float(temp)
        data["soc"] = None if soc is None else float(soc)
        return data


class ImpedanceSpectrumResponse(APIModel):
    cell_id: str
    spectrum_id: str
    frequencies_hz: List[float] = Field(default_factory=list)
    real_ohm: List[float] = Field(default_factory=list)
    imag_ohm: List[float] = Field(default_factory=list)
    z0: float
    rct: float
    peak_shift: float
    confidence: float
    risk_level: str
    method: Optional[str] = None
    message: Optional[str] = None


class ConsistencyCellMetric(APIModel):
    cell_id: str
    voltage: Optional[float] = None
    temperature: Optional[float] = None
    soc: Optional[float] = None
    current: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        data["cell_id"] = str(_first(data, "cell_id", "cellId", "deviceId", default="cell-1"))
        for field_name, legacy_key in (
            ("voltage", "voltage"),
            ("temperature", "temperature"),
            ("soc", "soc"),
            ("current", "current"),
        ):
            value = _first(data, field_name, legacy_key, default=None)
            data[field_name] = None if value is None else float(value)
        return data


class ConsistencyRequest(APIModel):
    cluster_id: str = "cluster-1"
    metric_type: str = "voltage"
    cells: List[ConsistencyCellMetric] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        data["cluster_id"] = str(_first(data, "cluster_id", "clusterId", "deviceId", default="cluster-1"))
        data["metric_type"] = str(_first(data, "metric_type", "metricType", "level", default="voltage"))
        raw_cells = _first(data, "cells", "cellMetrics", "measurements", "metrics", default=[])
        data["cells"] = _ensure_list(raw_cells)
        return data


class ConsistencyResponse(APIModel):
    device_id: str = Field(validation_alias="deviceId")
    cluster_id: str
    metric_type: str
    score: float
    overall_score: float
    volt_diff_max: float = Field(validation_alias="voltDiffMax")
    volt_std: float = Field(validation_alias="voltStd")
    temp_diff_max: float = Field(validation_alias="tempDiffMax")
    soc_deviation: float = Field(validation_alias="socDeviation")
    outlier_cells: List[str]
    sub_group_labels: List[int]
    confidence: float
    method: Optional[str] = None
    message: Optional[str] = None


class OmOptimizeRequest(APIModel):
    energy_unit_id: str = "eu-1"
    replace_pack_count: int = 5
    capacity_grading_count: int = 10
    cell_soh_data: Dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, values):
        if not isinstance(values, dict):
            return values
        data = dict(values)
        data["energy_unit_id"] = str(_first(data, "energy_unit_id", "energyUnitId", "stationId", default="eu-1"))
        data["replace_pack_count"] = int(_first(data, "replace_pack_count", "replacePackCount", "maxSwapCount", default=5))
        data["capacity_grading_count"] = int(_first(data, "capacity_grading_count", "capacityGradingCount", default=10))
        data["cell_soh_data"] = _numeric_map(_first(data, "cell_soh_data", "cellSohData", "cellSohMap", default={}))
        return data


class OmMapping(APIModel):
    target_position: str
    insert_cell_id: str
    before_soh: float
    after_soh: float
    expected_soh: Optional[float] = None
    expected_soh_gain: Optional[float] = None


class OmOptimizeResponse(APIModel):
    plan_id: str
    energy_unit_id: str
    replace_pack_count: int
    capacity_grading_count: int
    mappings: List[OmMapping] = Field(default_factory=list)
    estimated_soh_improvement: float
    estimated_cost: float
    estimated_duration: Optional[str] = None
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None
    steps: List[str] = Field(default_factory=list)
    optimization_method: Optional[str] = None
    swap_instructions: List[OmMapping] = Field(default_factory=list)
    total_cost: Optional[float] = None
    soh_improvement: Optional[float] = None
