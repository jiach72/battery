"""Battery Health Platform - Algorithm Engine FastAPI Application"""
import os
import logging
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from models.schemas import (
    SohPredictRequest, MicroShortCircuitRequest, LithiumPlatingRequest,
    DcirEstimateRequest, ConsistencyRequest, OmOptimizeRequest,
    ImpedanceSpectrumRequest,
)

logger = logging.getLogger(__name__)

INTERNAL_API_KEY = os.getenv("ALGO_INTERNAL_API_KEY", "")


def require_internal_api_key() -> str:
    """Fail closed: algorithm endpoints must never run without an internal key."""
    key = INTERNAL_API_KEY.strip()
    if not key or key.upper().startswith("CHANGE_ME") or len(key) < 32:
        raise RuntimeError("ALGO_INTERNAL_API_KEY must be set to a strong internal secret")
    return key


def verify_api_key(x_internal_token: str = Header(default="")):
    """内部API密钥验证：生产环境必须配置 ALGO_INTERNAL_API_KEY"""
    if x_internal_token != require_internal_api_key():
        raise HTTPException(status_code=403, detail="无效的内部API密钥")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """启动时预加载算法模块并做健康检查"""
    logger.info("算法引擎启动中，执行模块预加载...")
    require_internal_api_key()
    try:
        from core.derive import calculate_soh_value
        from core.state_data_prep import process_capacity_outlier
        from core.state_recognition import recognize_charge_discharge
        from core.capacity_calculation import calculate_capacity_by_coulomb
        from core.health_score_data_prep import extract_voltage_range
        from advanced.micro_short_circuit import detect_micro_short_circuit
        from advanced.lithium_plating import detect_lithium_plating
        from advanced.dcir_estimator import estimate_dcir
        from advanced.consistency_scorer import calculate_consistency
        from advanced.om_optimizer import optimize_plan
        from advanced.impedance_spectrum import analyze_impedance_spectrum
        logger.info("所有算法模块预加载成功")
    except ImportError as e:
        logger.error("算法模块加载失败: %s", e)
        raise
    yield
    logger.info("算法引擎已关闭")


app = FastAPI(
    title="Battery Health Algorithm Engine",
    version="1.0.0",
    description="6大算法模块: SOH预测/微短路检测/析锂检测/DCIR估算/一致性评分/运维优化",
    lifespan=lifespan,
)

CORS_ORIGINS = [origin for origin in os.getenv("ALGO_CORS_ORIGINS", "").split(",") if origin]

if CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(status_code=500, content={"code": -1, "message": "Internal server error"})


@app.get("/health")
async def health():
    return {"status": "ok", "service": "algorithm-engine"}


@app.post("/algo/soh/predict")
async def soh_predict(request: SohPredictRequest, _=Depends(verify_api_key)):
    """SOH评估与寿命预测 - Transformer-LSTM + PINN"""
    from core.derive import calculate_soh
    result = calculate_soh(request.model_dump())
    return {"code": 0, "data": result}


@app.post("/algo/micro-short-circuit/detect")
async def micro_short_circuit_detect(request: MicroShortCircuitRequest, _=Depends(verify_api_key)):
    """微短路检测 - Pseudo-OCV差分残差 + RLMQD"""
    from advanced.micro_short_circuit import detect_micro_short_circuit
    result = detect_micro_short_circuit(request.model_dump())
    return {"code": 0, "data": result}


@app.post("/algo/lithium-plating/detect")
async def lithium_plating_detect(request: LithiumPlatingRequest, _=Depends(verify_api_key)):
    """析锂检测 - ICA/DVA + FPCA + Isolation Forest"""
    from advanced.lithium_plating import detect_lithium_plating
    result = detect_lithium_plating(request.model_dump())
    return {"code": 0, "data": result}


@app.post("/algo/dcir/estimate")
async def dcir_estimate(request: DcirEstimateRequest, _=Depends(verify_api_key)):
    """DCIR估算 - 多阶ECM + 遗忘因子RLS"""
    from advanced.dcir_estimator import estimate_dcir
    result = estimate_dcir(request.model_dump())
    return {"code": 0, "data": result}


@app.post("/algo/consistency/score")
async def consistency_score(request: ConsistencyRequest, _=Depends(verify_api_key)):
    """一致性评分 - DBSCAN + SOM聚类"""
    from advanced.consistency_scorer import calculate_consistency
    result = calculate_consistency(request.model_dump())
    return {"code": 0, "data": result}


@app.post("/algo/om/optimize")
async def om_optimize(request: OmOptimizeRequest, _=Depends(verify_api_key)):
    """运维调换优化 - MILP + 鲸鱼优化"""
    from advanced.om_optimizer import optimize_plan
    result = optimize_plan(request.model_dump())
    return {"code": 0, "data": result}


@app.post("/algo/eis/analyze")
async def eis_analyze(request: ImpedanceSpectrumRequest, _=Depends(verify_api_key)):
    """阻抗谱分析 - Nyquist/Bode baseline"""
    from advanced.impedance_spectrum import analyze_impedance_spectrum
    result = analyze_impedance_spectrum(request.model_dump())
    return {"code": 0, "data": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("ALGORITHM_HOST", "0.0.0.0"), port=int(os.getenv("ALGORITHM_PORT", 8000)))
