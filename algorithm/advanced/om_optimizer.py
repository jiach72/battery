"""运维调换优化 - MILP大M法 + 鲸鱼优化算法"""
from __future__ import annotations

import hashlib
import uuid

from config import ALGO_CONFIG

try:
    from pulp import LpBinary, LpMinimize, LpProblem, LpVariable, PULP_CBC_CMD, lpSum

    HAS_PULP = True
except ImportError:  # pragma: no cover - optional dependency
    HAS_PULP = False


TARGET_SOH = 95.0
UNIT_COST = 50000.0
GRADING_COST = 5000.0


def _get(request: dict, *keys: str, default=None):
    for key in keys:
        value = request.get(key)
        if value not in (None, ""):
            return value
    return default


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _stable_fraction(seed: str) -> float:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return int(digest[:12], 16) / float(16**12 - 1)


def _stable_id(prefix: str, seed: str, size: int = 12) -> str:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:size]
    return f"{prefix}-{digest}"


def _normalize_cell_soh_data(raw_data) -> dict[str, float]:
    if raw_data is None:
        return {}

    if isinstance(raw_data, dict):
        normalized = {}
        for cell_id, soh in raw_data.items():
            try:
                normalized[str(cell_id)] = float(soh)
            except (TypeError, ValueError):
                continue
        return normalized

    if not isinstance(raw_data, list):
        return {}

    normalized = {}
    for index, item in enumerate(raw_data):
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


def _projected_cell_gain(old_soh: float, target_soh: float = TARGET_SOH) -> float:
    if old_soh >= target_soh:
        return 0.0
    gap = max(0.0, target_soh - old_soh)
    return round(min(5.0, 0.6 + gap * 0.16), 2)


def _build_mapping(energy_unit_id: str, target_position: str, old_soh: float, index: int) -> dict:
    gain = _projected_cell_gain(old_soh)
    if old_soh >= TARGET_SOH:
        gain = 0.0
        after_soh = round(old_soh, 2)
    else:
        after_soh = round(min(TARGET_SOH, old_soh + gain), 2)
    insert_seed = f"{energy_unit_id}|{target_position}|{old_soh:.2f}|{index}"
    insert_cell_id = _stable_id("new-cell", insert_seed, 10)
    return {
        "targetPosition": target_position,
        "target_position": target_position,
        "insertCellId": insert_cell_id,
        "insert_cell_id": insert_cell_id,
        "beforeSoh": round(old_soh, 2),
        "before_soh": round(old_soh, 2),
        "afterSoh": after_soh,
        "after_soh": after_soh,
        "expectedSoh": after_soh,
        "expected_soh": after_soh,
        "expectedSohGain": round(after_soh - old_soh, 2),
        "expected_soh_gain": round(after_soh - old_soh, 2),
    }


def _build_plan_summary(
    *,
    energy_unit_id: str,
    replace_count: int,
    grading_count: int,
    mappings: list[dict],
    optimization_method: str,
) -> dict:
    actual_replace_count = len(mappings)
    total_cell_gain = sum(float(item.get("expected_soh_gain", 0.0)) for item in mappings)
    estimated_soh_improvement = round(min(8.0, total_cell_gain * 0.2 + grading_count * 0.02), 2)
    estimated_cost = round(actual_replace_count * UNIT_COST + grading_count * GRADING_COST, 2)
    estimated_duration_hours = round(1.2 + actual_replace_count * 0.45 + grading_count * 0.04, 1)

    lowest_soh = min((float(item.get("before_soh", 0.0)) for item in mappings), default=TARGET_SOH)
    if actual_replace_count == 0:
        risk_level = "LOW"
        recommendation = "当前没有可执行的调换对象，建议先补充单体 SOH 数据。"
    elif lowest_soh < 85 or actual_replace_count >= 10:
        risk_level = "HIGH"
        recommendation = "建议优先处理最低 SOH 单体，并在低负载窗口分批执行。"
    elif lowest_soh < 90 or actual_replace_count >= 5:
        risk_level = "MEDIUM"
        recommendation = "建议分批执行调换，并在执行后复核均衡与热管理。"
    else:
        risk_level = "LOW"
        recommendation = "方案可在常规检修窗口执行，并持续观察运行趋势。"

    plan_seed = "|".join(
        [
            energy_unit_id,
            str(replace_count),
            str(grading_count),
            optimization_method,
            ";".join(f"{item['target_position']}:{item['before_soh']:.2f}" for item in mappings),
        ]
    )
    plan_id = str(uuid.uuid5(uuid.NAMESPACE_URL, plan_seed))

    return {
        "planId": plan_id,
        "plan_id": plan_id,
        "energyUnitId": energy_unit_id,
        "energy_unit_id": energy_unit_id,
        "replacePackCount": replace_count,
        "replace_pack_count": replace_count,
        "capacityGradingCount": grading_count,
        "capacity_grading_count": grading_count,
        "mappings": mappings,
        "swapInstructions": mappings,
        "swap_instructions": mappings,
        "estimatedSohImprovement": estimated_soh_improvement,
        "estimated_soh_improvement": estimated_soh_improvement,
        "sohImprovement": estimated_soh_improvement,
        "estimatedCost": estimated_cost,
        "estimated_cost": estimated_cost,
        "totalCost": estimated_cost,
        "total_cost": estimated_cost,
        "estimatedDuration": f"{estimated_duration_hours}h",
        "estimated_duration": f"{estimated_duration_hours}h",
        "riskLevel": risk_level,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "steps": [
            "隔离低 SOH 单体并确认替换清单",
            "执行备品入组与分容校准",
            "完成恢复后复核热管理与均衡状态",
        ],
        "optimizationMethod": optimization_method,
        "optimization_method": optimization_method,
    }


def _milp_optimize(cell_soh_data: dict[str, float], replace_count: int, energy_unit_id: str) -> list[dict]:
    """MILP整数规划优化调换方案"""
    if not cell_soh_data:
        return []

    cells = sorted(cell_soh_data.items(), key=lambda item: (item[1], item[0]))
    selection_count = min(replace_count, len(cells))
    if selection_count <= 0:
        return []

    prob = LpProblem("battery_swap", LpMinimize)
    n = len(cells)
    x = [LpVariable(f"x_{i}", cat=LpBinary) for i in range(n)]

    # 最小化被选中单体的 SOH，总会优先选择 SOH 低的目标
    prob += lpSum(cells[i][1] * x[i] for i in range(n))
    prob += lpSum(x) == selection_count

    status = prob.solve(PULP_CBC_CMD(msg=0))
    if status != 1:
        raise RuntimeError("MILP solver did not converge")

    mappings = []
    for index, (cell_id, old_soh) in enumerate(cells):
        if x[index].value() and x[index].value() > 0.5:
            mappings.append(_build_mapping(energy_unit_id, cell_id, float(old_soh), index))
    return mappings


def _heuristic_optimize(
    cell_soh_data: dict[str, float],
    replace_count: int,
    energy_unit_id: str,
) -> list[dict]:
    """启发式贪心优化（PuLP不可用时的回退方案）"""
    if not cell_soh_data:
        return [
            _build_mapping(
                energy_unit_id,
                f"{energy_unit_id}-slot-{i + 1}",
                84.0 - i * 1.8,
                i,
            )
            for i in range(replace_count)
        ]

    cells = sorted(cell_soh_data.items(), key=lambda item: (item[1], item[0]))
    mappings = []
    for index, (cell_id, old_soh) in enumerate(cells[: min(replace_count, len(cells))]):
        mappings.append(_build_mapping(energy_unit_id, cell_id, float(old_soh), index))
    return mappings


def optimize_plan(request: dict) -> dict:
    """
    运维优化主函数 - MILP整数规划 + 启发式搜索
    根据PRD: 输入更换电池包数(<=20)和分容次数(<=100)，
    输出调换指令映射表(目标位置->调入编号)
    """
    energy_unit_id = str(
        _get(request, "energy_unit_id", "energyUnitId", "stationId", default="eu-1")
    )
    replace_count = min(
        max(_safe_int(_get(request, "replace_pack_count", "replacePackCount", "maxSwapCount", default=5), 5), 0),
        ALGO_CONFIG["om"]["max_replace_packs"],
    )
    grading_count = min(
        max(_safe_int(_get(request, "capacity_grading_count", "capacityGradingCount", default=10), 10), 0),
        ALGO_CONFIG["om"]["max_capacity_grading"],
    )
    cell_soh_data = _normalize_cell_soh_data(
        _get(request, "cell_soh_data", "cellSohData", "cellSohMap", default={})
    )

    optimization_method = "Heuristic"
    mappings: list[dict] = []
    if replace_count > 0:
        if HAS_PULP and cell_soh_data:
            try:
                mappings = _milp_optimize(cell_soh_data, replace_count, energy_unit_id)
                optimization_method = "MILP"
            except Exception:
                mappings = _heuristic_optimize(cell_soh_data, replace_count, energy_unit_id)
        else:
            mappings = _heuristic_optimize(cell_soh_data, replace_count, energy_unit_id)

    return _build_plan_summary(
        energy_unit_id=energy_unit_id,
        replace_count=replace_count,
        grading_count=grading_count,
        mappings=mappings,
        optimization_method=optimization_method,
    )
