# **电池健康管理平台 \- 全栈开发工程约束与PRD** 

**对 AI IDE 的核心指令**：本文档是构建【电池健康管理平台】的唯一事实来源（Single Source of Truth）。在生成架构、数据库实体、API、Python 算法和前端组件时，必须严格遵守本文档中定义的字段命名、公式逻辑和目录结构。**禁止任何未经文档定义的“幻觉”创造。**

## **0\. 产品愿景与业务蓝图 (Product Vision)**

* **业务定义**：面向“电化学储能电站”（磷酸铁锂），提供全生命周期的电池健康管理 SaaS 平台。  
* **物理拓扑层级**：电站 (Station) \-\> 能量单元 (Energy Unit) \-\> 电池单元 (Battery Unit) \-\> 电池簇 (Battery Cluster) \-\> 电池单体 (Cell)。*另包含附属设备：PCS（储能变流器）、变压器。*  
* **核心价值**：通过采集电池侧时序数据，利用算法诊断起火风险（微短路/析锂）、评估健康度衰减（SOH），并自动生成“电池包线下调换指导方案”，以延长电站寿命、提升收益。

## **1\. 架构选型与UI工程规范 (Architecture & UI Specs)**

### **1.1 全栈技术选型**

* **Frontend**: React 18+ \+ React-Router v6 \+ Redux Toolkit \+ Tailwind CSS \+ Ant Design 5.x \+ ECharts \+ Three.js。  
* **Backend**: Spring Cloud, Spring Boot, Spring Gateway, RESTful API。  
* **Algorithm**: Python 3.9+ (Pandas, PySpark, Scikit-learn)。  
* **Storage**: InfluxDB (时序), Neo4j (拓扑图), MySQL (业务账单/告警), Redis (缓存)。  
* **MQ**: Kafka, Mosquitto。

### **1.2 ⚡ UI/UX 风格强制约束 (No "AI Style")**

**禁令**：禁止使用典型的“AI生成风”（如：廉价的渐变紫边框、无意义的赛博朋克发光外发光特效、过度圆角）。

* **企业级质感 (Enterprise-grade)**：采用极致克制的数据密集型设计。使用干净的细线条分隔、清晰的无衬线字体（Inter / Roboto）、高对比度的数据呈现。  
* **双色主题 (Dark / Light Mode)**：系统必须内置深浅双色主题，通过 Tailwind 的 dark: 类和 AntD 的 theme.algorithm 进行原子化控制。  
* **语义色**：仅在告警状态使用语义色：\#F5222D(高风险红), \#FAAD14(中风险黄), \#52C41A(正常绿)。  
* **全局组件要求**：系统所有数据看板页面右上角，**强制提供 全局组件：数据最后更新时间 (YYYY-MM-DD HH:mm:ss)**。

## **2\. 数据库实体与全量数据字典 (Database Schema & Dictionary)**

### **2.1 数据库结构边界**

* **Neo4j**: 拓扑关系。实体包括：User, Role, Menu, Station, EnergyUnit, BatteryUnit, BatteryCluster, Cell, Analog, AlarmRule。  
* **MySQL**: 业务数据。表名：data\_alarm\_event, data\_bill\_electricity, data\_system\_log。  
* **InfluxDB**: 时序量测。表名：量测表\_集装箱N\_{原始/5分钟/15分钟/1天}。  
* **Redis 分组前缀**: rt\_measure:, ledger\_cache:, alarm\_rule:, analog\_map:。

### **2.2 核心词典与业务字段映射 (AI代码生成必用)**

* **风险枚举**: capacity\_risk, volt\_risk, short\_circuit\_risk, temp\_risk, liout\_risk。  
* **算法侧关键数据项映射表 (Data Items)**:  
  * RealSOH (实际SOH), TheorySOH (理论SOH)  
  * UsedRecycleTimes (已用循环次数), RemainingRecycleTimes (循环剩余次数)  
  * BatteryMileageAmount (总里程), BatteryMileageDay (日里程)  
  * ChargeEndMaxVoltDiff (充电末端最大极差), ChargeEndVoltSTD (充电末端标准差), ChargeEndSOC (充电末端SOC), ChargeEndVoltageDeviation (偏离度)  
  * CellMaxTemp (最高温度), MaxCellTempRange (最大温度极差)  
  * ForecastProfitMonth (预测月收益)  
  * *⚡附属设备指标*：PCS累计效率, PCS日效率, 变压器累计效率, 变压器日效率。

## **3\. Python 算法工程结构与逻辑约束 (Algorithm Engine)**

**🚨 工程结构约束**：Python 算法端禁止写成单一脚本，必须按照以下物理文件结构组织模块。

### **3.1 物理文件结构映射**

* **配置文件**: config.py (必须包含 general\_map 字典承载静态配置，如 energy\_zero\_date 零度电量基准日等)。  
* **基础计算模块**:  
  * state\_data\_prep.py: 数据预处理 (含 process\_capacity\_outlier 异常值剔除函数)。  
  * state\_recognition.py: 充放电状态识别。  
  * capacity\_calculation.py: 容量计算。  
* **健康与效率计算模块**:  
  * derive.py & data\_summary.py: SOH计算、循环次数、里程计算、收益预测。  
* **健康分计算模块**:  
  * health\_score\_data\_prep.py: 提取电压极差、短路/析锂特征。  
  * health\_data\_summary.py: 加权计算最终一致性得分。

### **3.2 核心硬算法规则**

1. **容量与效率**：  
   * 采用 安时积分法 计算放电量。  
   * 能量效率 \= 当日满放电量 / 当日满充电量 \* 100%。  
2. **预警诊断**：  
   * **微短路**：计算同层级单体充放电末端电压的 **5%分位数**，小于此值判定为微短路。  
   * **析锂**：筛选 电压 \> 3.5V 的数据，寻找 Δq/Δv 峰值异常点。  
   * **内阻**：充电起始后 **10秒**，计算 R \= ΔU/I \* 1000 (mΩ)。  
3. **预测回归 (Linear Regression)**：  
   * 基于 n \>= 30 天历史数据构建线性回归。预测工况\*\*强制要求使用“最近半个月的平均工况”\*\*作为输入因子。

## **4\. 前端视图树与组件渲染规范 (Frontend Views)**

### **4.1 路由视图树**

\<Route path="/" element={\<Layout /\>}\>  
  \<Route path="dashboard" element={\<Dashboard /\>} /\>  
  \<Route path="dashboard/realtime" element={\<RealtimeDetail /\>} /\> {/\* 实时工况详情 \*/}  
  \<Route path="clinic" element={\<ClinicLayout /\>}\>  
    \<Route path="overview" element={\<Overview /\>} /\>  
    \<Route path="detail" element={\<AssessmentDetail /\>} /\>  
    \<Route path="capacity" element={\<CapacityAnalysis /\>} /\>  
    \<Route path="mileage" element={\<MileageAnalysis /\>} /\>  
    \<Route path="safety" element={\<SafetyAssessment /\>} /\>  
    \<Route path="efficiency" element={\<EfficiencyAnalysis /\>} /\>  
  \</Route\>  
  \<Route path="om" element={\<OMSimulation /\>} /\>  
  \<Route path="basic-data"\>  
    \<Route path="devices" element={\<DeviceLedger /\>} /\>  
    \<Route path="permissions" element={\<RBACManagement /\>} /\>  
  \</Route\>  
\</Route\>

### **4.2 核心页面渲染规则 (UI Behavior)**

1. **电池驾驶舱 (Dashboard)**:  
   * 3x2 卡片网格。  
   * 中间位：引入 Three.js 渲染的电池舱热点图模型。  
   * 图表渲染强规则：涉及预测收益、预测衰减的 ECharts 系列（Series），必须设置 lineStyle.type \= 'dashed'。  
2. **⚡ 实时工况与监测 (RealtimeDetail) \[包含核心子Tab\]**:  
   * **子Tab 1：运行对比曲线** (对比指定电池单元/簇的电压、电流、SOC实时曲线)。  
   * **子Tab 2：温度热点图** (以色块矩阵形式展示所有单体的实时温度，区分正常和异常值域 \[5,45\]℃)。  
3. **电池问诊室 (Clinic)**:  
   * **单体下钻页**：充/放电末端电压分析图表，必须是包含 **三个Y轴的混排折线图** (极差 \[V\], 标准差 \[无单位\], SOC \[%\])。  
4. **安全评估列表 (Safety Assessment) 排序强逻辑**:  
   * 必须按 高风险 \> 中风险 \> 低风险 排序。  
   * 同级别中，按持有“最高风险等级”的项数降序。  
   * “低风险”项直接在UI列表中隐藏（前端执行 filter）。  
5. **运维沙盘 (O\&M Simulation)**:  
   * 提供防抖表单：更换电池包数 (≤20), 分容次数 (≤100)。  
   * 返回调换指令映射表 (目标位置 \-\> 调入编号)，提供导出PDF按钮 (jsPDF 或类似库)。

## **5\. API 契约设计 (RESTful Contracts)**

* **Dashboard**: GET /api/v1/dashboard/overview?energyUnitId={id}  
* **实时工况卡片**: GET /api/v1/dashboard/realtime/clusters?energyUnitId={id}  
* **多维评估列表 (支持批量过滤)**: POST /api/v1/clinic/assessment-list  
  * Payload: { deviceId: String, level: 'CELL'|'UNIT', scoreRanges: \['80-100', '50-60'\] }  
* **单体多Y轴端点分析**: GET /api/v1/clinic/cell/{cellId}/endpoint-analysis?type=CHARGE|DISCHARGE  
* **测算运维调换方案**: POST /api/v1/om/simulate-plan  
  * Payload: { energyUnitId, replacePackCount, capacityGradingCount }

## **6\. 环境与隔离部署要求 (Deployment)**

* **网络隔离 (工业级特征)**: 生产环境 EMS 采集数据通过 **安全II区** 使用 **正向隔离装置 (UDP单向穿透)** 送达 **安全III区** Kafka 总线。后端架构禁止依赖外部TCP直连。  
* **国产信创适配**: 数据库脚本及ORM需兼容达梦(DM)、人大金仓等国产数据库，底层避免使用特有的MySQL闭源方言。系统运行OS为统信 UOS 等 Linux 发行版。
