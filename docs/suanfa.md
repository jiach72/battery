# 电池健康平台算法审计与格式整理

> 审计对象：`algorithm/` 目录下的算法实现，以及 `algorithm/app.py` 和 `algorithm/models/schemas.py`
>
> 审计口径：按当前代码实现评估，不按理想 PRD 口径打分

## 审计结论

当前算法层可以支撑演示和基础联调，但整体更接近 MVP / 占位实现，和 PRD 中描述的“Transformer-LSTM + PINN、FPCA + Isolation Forest、RLS、DBSCAN + SOM、MILP + 鲸鱼优化”存在明显落差。

原始审计时，`DCIR` 和 `一致性评分` 两个模块的结果带有随机性，不能直接用于生产告警、报表或调换决策；本次已改为确定性实现。

## 已修复项

- `algorithm/app.py` 的启动预加载已切到真实函数名，包级导入和 `uvicorn app:app` 两种启动方式都可用。
- `algorithm/advanced/dcir_estimator.py` 已改为输入驱动的确定性估算，不再返回随机参数。
- `algorithm/advanced/consistency_scorer.py` 已改为基于测量数据或保守回退的确定性评分，不再随机出离群单体。
- `algorithm/advanced/om_optimizer.py` 已统一输出 `mappings`、`estimatedCost`、`estimatedSohImprovement` 等兼容字段，并修正了 MILP 目标函数。
- `algorithm/core/health_score_data_prep.py` 和 `algorithm/core/health_data_summary.py` 已统一 `lithium_risk_score` / `liout_risk_score` 的兼容读取。

## 模块总览

| 模块 | 当前实现 | 与 PRD 一致性 | 结论 |
|---|---|---:|---|
| SOH评估与寿命预测 | 线性回归 + 静态估算 | 低 | 可做 baseline |
| 微短路检测 | 5%分位数 + 滑动标准差阈值 | 中 | 规则可用，但很简化 |
| 析锂检测 | ICA 近似 + MAD 异常分数 | 中 | 可演示，不是完整 FPCA / Isolation Forest |
| DCIR估算 | 确定性 Thevenin 近似 + 保守回退 | 低 | 可联调，非完整 RLS |
| 一致性评分 | 确定性统计评分 + 保守回退 | 低 | 可联调，非完整 DBSCAN/SOM |
| 运维调换优化 | PuLP / 贪心回退 + 兼容映射 | 中 | 可用作规则版原型 |

## 关键问题

### Critical

- [已修复] `algorithm/advanced/dcir_estimator.py:8-20` - 直接随机生成 `R0`、`R1`、`R2`、`C1` 和 `confidence`，结果与输入数据无关。
- [已修复] `algorithm/advanced/consistency_scorer.py:8-17` - 直接随机生成一致性评分、离群单体和子群标签，结果不可复现。

### Warning

- `algorithm/core/derive.py:24-95` - SOH 预测使用线性回归和静态估算，和 PRD 中的 Transformer-LSTM + PINN 不一致。
- `algorithm/advanced/lithium_plating.py:37-94` - 当前是阈值 + MAD 的近似实现，不是完整的 FPCA + Isolation Forest 流程。
- `algorithm/advanced/om_optimizer.py:24-43,86-114` - 依赖 PuLP 时才走简化 MILP，缺数据时会生成示意性调换映射。
- `algorithm/models/schemas.py:21-85` 与 `algorithm/app.py:70-115` - 返回结构和响应模型已做兼容，但 `app.py` 仍未显式声明 `response_model`，文档约束还能再收紧。

### Suggestion

- `algorithm/core/health_score_data_prep.py:37-81` - `liout_risk_score` 拼写不一致，建议统一为 `lithium_risk_score`。
- `algorithm/app.py:17-20` - 内部 API Key 只有在环境变量存在时才强制校验，生产环境要明确是否允许空密钥。

## 模块明细

### 1. SOH评估与寿命预测

当前实现位于 `algorithm/core/derive.py`。历史数据足够时，代码使用 `LinearRegression` 拟合 `soh` 随时间的变化；数据不足时，直接按标称容量和固定折算值做静态估算。

结论是：这是一版可运行的 baseline，不是 PRD 中描述的深度时序模型。适合演示趋势，不适合承诺精度。

### 2. 微短路检测

当前实现位于 `algorithm/advanced/micro_short_circuit.py` 和 `algorithm/core/health_score_data_prep.py`。方法是取电压 5% 分位数，结合滑动标准差构造自适应阈值，再用残差判断风险。

结论是：规则清晰、可解释性还可以，但算法复杂度远低于文档描述的 Pseudo-OCV + RLMQD 方案。

### 3. 析锂检测

当前实现位于 `algorithm/advanced/lithium_plating.py`。代码确实做了高电压区筛选、ICA 近似计算和异常分数，但实际使用的是简化特征和 MAD 近似，不是完整的 FPCA + Isolation Forest 流程。

结论是：适合做早期原型，不适合把文档写成“精准捕捉”。

### 4. DCIR估算

当前实现位于 `algorithm/advanced/dcir_estimator.py`。函数名和注释写的是 Thevenin ECM + RLS，但返回值是随机数。

结论是：这是最高风险模块之一。只要还保留随机输出，就不能拿去做报表、阈值联动或设备诊断。

### 5. 一致性评分

当前实现位于 `algorithm/advanced/consistency_scorer.py`。代码没有使用输入特征，而是随机生成总分、离群电芯和标签。

结论是：这不是算法，只是占位数据生成器。必须在进入生产前重写。

### 6. 运维调换优化

当前实现位于 `algorithm/advanced/om_optimizer.py`。有 PuLP 时会做一个很轻量的 MILP 求解，没有数据时会生成示意映射。它和 PRD 中的“大M法 + 鲸鱼优化”仍有距离，但至少结果是可复现的。

结论是：可以先作为规则版排程原型，但文档不能写成已经完成完整全局优化。

## 整改建议

1. 先把 `DCIR` 和 `一致性评分` 的随机输出改成确定性逻辑。
2. 给 `app.py` 增加 `response_model`，让返回结构和 Pydantic 模型对齐。
3. 把 PRD 文案里的“极高、完美、彻底”等表述收紧，改成“基线版、原型版、近似版”。
4. 如果要保留当前实现，就把它明确标成“演示版实现”，不要再和深度模型混写。
5. 统一命名、字段名和注释，先消掉 `liout_risk_score` 这类低成本问题。

## 交付口径

这份文档现在已经从原始长文本整理成结构化审计稿。后续如果继续迭代，建议把“目标算法设计”和“当前实现状态”拆成两个独立章节，避免把 PRD、实现和审计结论混在一起。
