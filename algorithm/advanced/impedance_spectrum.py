"""阻抗谱 baseline 分析 - 可解释、可回退、确定性输出"""
from __future__ import annotations

import hashlib
import math

import numpy as np


def _get(request: dict, *keys: str, default=None):
    for key in keys:
        value = request.get(key)
        if value not in (None, ""):
            return value
    return default


def _to_float_array(values) -> np.ndarray:
    if values is None:
        return np.array([], dtype=np.float64)
    if isinstance(values, dict):
        iterable = values.values()
    elif isinstance(values, np.ndarray):
        iterable = values.tolist()
    elif isinstance(values, (list, tuple, set)):
        iterable = values
    else:
        iterable = [values]

    cleaned = []
    for value in iterable:
        try:
            cleaned.append(float(value))
        except (TypeError, ValueError):
            continue
    return np.asarray(cleaned, dtype=np.float64)


def _stable_fraction(seed: str) -> float:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return int(digest[:12], 16) / float(16**12 - 1)


def _classify_risk(z0: float, rct: float, confidence: float) -> str:
    score = z0 + rct
    if confidence < 0.35 or score >= 0.42:
        return "high"
    if score >= 0.26:
        return "medium"
    return "low"


def _build_result(
    *,
    cell_id: str,
    spectrum_id: str,
    frequencies_hz: list[float],
    real_ohm: list[float],
    imag_ohm: list[float],
    z0: float,
    rct: float,
    peak_shift: float,
    confidence: float,
    risk_level: str,
    method: str,
    message: str | None = None,
) -> dict:
    result = {
        "cellId": cell_id,
        "cell_id": cell_id,
        "spectrumId": spectrum_id,
        "spectrum_id": spectrum_id,
        "frequenciesHz": [round(v, 6) for v in frequencies_hz],
        "frequencies_hz": [round(v, 6) for v in frequencies_hz],
        "realOhm": [round(v, 6) for v in real_ohm],
        "real_ohm": [round(v, 6) for v in real_ohm],
        "imagOhm": [round(v, 6) for v in imag_ohm],
        "imag_ohm": [round(v, 6) for v in imag_ohm],
        "z0": round(float(z0), 6),
        "rct": round(float(rct), 6),
        "peakShift": round(float(peak_shift), 6),
        "peak_shift": round(float(peak_shift), 6),
        "confidence": round(float(confidence), 3),
        "riskLevel": risk_level,
        "risk_level": risk_level,
        "method": method,
    }
    if message:
        result["message"] = message
    return result


def _fallback_spectrum(cell_id: str, frequencies_hz: np.ndarray, real_ohm: np.ndarray, imag_ohm: np.ndarray) -> dict:
    seed = f"{cell_id}|{len(frequencies_hz)}|fallback"
    base = 0.11 + _stable_fraction(seed) * 0.07
    frequencies = frequencies_hz.tolist() if frequencies_hz.size else [0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0]
    real = real_ohm.tolist() if real_ohm.size else [base + i * 0.003 for i in range(len(frequencies))]
    imag = imag_ohm.tolist() if imag_ohm.size else [-(0.006 + i * 0.003) for i in range(len(frequencies))]
    z0 = real[0] if real else base
    rct = max(0.02, min(0.12, (real[-1] - real[0]) * 0.65 if len(real) > 1 else base * 0.4))
    peak_shift = abs(imag[len(imag) // 2]) if imag else 0.01
    confidence = 0.28 + min(0.22, len(frequencies) / 50.0)
    risk_level = _classify_risk(z0, rct, confidence)
    return _build_result(
        cell_id=cell_id,
        spectrum_id=f"eis-{cell_id}",
        frequencies_hz=frequencies,
        real_ohm=real,
        imag_ohm=imag,
        z0=z0,
        rct=rct,
        peak_shift=peak_shift,
        confidence=confidence,
        risk_level=risk_level,
        method="fallback-baseline",
        message="输入数据不足，使用阻抗谱回退样例",
    )


def analyze_impedance_spectrum(request: dict) -> dict:
    cell_id = str(_get(request, "cell_id", "cellId", "deviceId", default="cell-1"))
    method = str(_get(request, "method", "algoMethod", default="deterministic-nyquist-baseline"))
    frequencies = _to_float_array(_get(request, "frequencies_hz", "frequenciesHz", "frequency", default=[]))
    real = _to_float_array(_get(request, "real_ohm", "realOhm", "zReal", default=[]))
    imag = _to_float_array(_get(request, "imag_ohm", "imagOhm", "zImag", default=[]))

    if frequencies.size == 0 or real.size == 0 or imag.size == 0:
        result = _fallback_spectrum(cell_id, frequencies, real, imag)
        result["method"] = method
        return result

    sample_count = min(len(frequencies), len(real), len(imag))
    frequencies = frequencies[:sample_count]
    real = real[:sample_count]
    imag = imag[:sample_count]

    z0 = float(real[0])
    rct = float(max(0.01, np.percentile(real, 90) - np.percentile(real, 10)))
    peak_index = int(np.argmax(np.abs(imag)))
    peak_shift = float(abs(imag[peak_index]))
    spread = float(np.std(real) + np.std(imag))
    confidence = max(0.3, min(0.98, 0.55 + min(0.25, sample_count / 40.0) - min(0.15, spread * 0.2)))
    risk_level = _classify_risk(z0, rct, confidence)

    return _build_result(
        cell_id=cell_id,
        spectrum_id=f"eis-{cell_id}",
        frequencies_hz=frequencies.tolist(),
        real_ohm=real.tolist(),
        imag_ohm=imag.tolist(),
        z0=z0,
        rct=rct,
        peak_shift=peak_shift,
        confidence=confidence,
        risk_level=risk_level,
        method=method,
    )
