# Pilot Merchant Intake Playbook V1（首批真实商家试点接入操作手册）

> 类型：**内部操作手册（SOP）· 纯文档**　｜　日期：2026-06-04　｜　任务：TASK-046
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不改页面 / 不改功能 / 不实现 AI·MVS·Workflow**。本文只输出文档。
> 读者：**TOT 内部人员**（采集员 / 运营 / 项目负责人）。这不是销售话术、不是客户合同、不是 AI 自动诊断流程。
> 上承（须保持一致）：[PROJECT_STATE](./PROJECT_STATE.md) · [merchant-operating-health-check-architecture-v1](./merchant-operating-health-check-architecture-v1.md) · [merchant-growth-diagnostic-architecture-v1](./merchant-growth-diagnostic-architecture-v1.md) · [merchant-validation-system-architecture-v1](./merchant-validation-system-architecture-v1.md) · [evidence-framework-specification-v1](./evidence-framework-specification-v1.md) · [merchant-growth-delivery-architecture-v1](./merchant-growth-delivery-architecture-v1.md) · [merchant-success-architecture-v1](./merchant-success-architecture-v1.md) · [commercial-operating-architecture-v1](./commercial-operating-architecture-v1.md) · [p2-chain-review-and-refactor-check-v1](./p2-chain-review-and-refactor-check-v1.md)

---

## ⚠️ 两条贯穿全手册的最高约束

1. **Human Commercial Authority（人类商业决策权）**：系统**只提供依据**，**不决定**是否合作 / 收费 / 投入资源 / 进入试点 / 放大流量。所有商业决策由商务 / 项目负责人 / 公司管理层做。
2. **Evidence-Based（证据驱动）**：所有录入须服从[证据宪法 E0–E3](./evidence-framework-specification-v1.md)。**不编数据、不替商家美化、不把猜测写成事实。** 不知道就标"待补充 / 待验证"，不强行补结论。

---

## 第 1 章　Playbook Purpose（手册目的）

本手册回答一件事：**内部人员如何把一个真实商家，干净、诚实、可追溯地接入 TOT 系统。**

它**不是**：
- ❌ 销售话术（怎么说服商家签约）
- ❌ 客户合同（法律/商务条款）
- ❌ AI 自动诊断流程（系统不自动判断商家行不行）

它**是**：内部人员接入首批真实商家的**操作手册（SOP）**。目标：
1. **采集真实信息**（商家事实 E1）
2. **建立商家资产**（Merchant + 11 个 1-1 资产）
3. **发现经营缺口**（五器官里哪一格漏血 / 数据缺失）
4. **判断是否具备增长承接能力**（不是判断"要不要做"，而是"放大会不会崩"）
5. **为后续执行 / 验证(MVS) / 复盘 / 经验沉淀留依据**

> 一句话：**把表填满不是目的；把一个商家的经营事实、增长基础、承接能力、风险缺口、下一步路径清楚地放进系统，才是目的。**

---

## 第 2 章　Pilot Merchant Intake Principles（试点接入八原则）

| # | 原则 | 含义 |
|---|---|---|
| 1 | **先事实，后判断** | 先把 E1 商家事实采进系统，再谈诊断/策略。没有事实的判断是 E0 猜测。 |
| 2 | **先基线，后增长** | 没有 Baseline，就无法证明增长（呼应 [MVS](./merchant-validation-system-architecture-v1.md)）。 |
| 3 | **先承接，后引流** | 先看 Operating Capacity（履约/组织），再谈引流。接不住的引流是风险放大器。 |
| 4 | **先小闭环，后放大** | 先单商家跑通最小链路，再考虑放量（呼应 CODE.md 不提前平台化）。 |
| 5 | **先记录缺口，不强行补结论** | 缺数据就标缺口，**不要脑补**。缺口本身是高价值信息。 |
| 6 | **系统提供依据，人做商业决策** | Human Commercial Authority。 |
| 7 | **不为填满表单而编信息** | 宁可留空 / 标"待补充"，不造假。 |
| 8 | **无证据不下确定结论** | 过不了[证据问责五问](./evidence-framework-specification-v1.md)的，只能作"假设"。 |

---

## 第 3 章　Before Creating Merchant（创建商家之前）

真实接入前，**线下人员**应先确认（这是线下沟通，不在系统里）：

- [ ] 商家是否有**合作意向**
- [ ] 是否愿意提供**基础资料**（行业、卖点、联系方式）
- [ ] 是否愿意配合**内容采集**（素材、拍摄）
- [ ] 是否能提供**基本经营数据**（营业额/客流/客单，哪怕是估计）
- [ ] 是否能配合**后续复盘**（周期性给真实结果）
- [ ] 是否理解 **TOT 不承诺虚假增长**（诚实交付，见[交付架构](./merchant-growth-delivery-architecture-v1.md)）
- [ ] 是否接受**先做小范围试点**（不是一上来就大投入）

> **决策归属**：以上是"是否进入试点"的依据采集，**最终是否合作由商务 / 项目负责人 / 管理层决定**，系统与本手册都不替人拍板。

---

## 第 4 章　Step 1 — Create Merchant（创建商家主体）

**入口**：`/dashboard/merchants` → 「+ 新建商家」（`/dashboard/merchants/new`）。

记录字段（仅主体信息）：

| 字段 | 说明 |
|---|---|
| 商家名称（name）| 真实名称 |
| 行业（industry）| 大类即可，细分留给 Profile |
| 城市 / 国家（city / country）| 用于后续经验切片维度 |
| 联系人（contactName）| |
| 联系方式（contactPhone / contactEmail）| |
| 状态（status）| 新建默认 `lead`（已接触/待评估）；合作中 `active`；`paused`；`archived` |
| 备注（notes）| 仅主体层备注 |

> ⚠️ **强调**：Merchant 只是**根主体**。**不要把诊断/画像/经营信息塞进 `notes`**——那些有对应的资产节点（Profile / Baseline / Operating Capacity / TB-001~008）。备注塞业务信息会破坏后续可追溯性与五器官读取。
> 创建后，所有权 owner = createdBy = 当前登录用户的 profile（决定权限可见性，见第 11 章/权限）。

---

## 第 5 章　Step 2 — Fill Merchant Profile（商家画像）

**入口**：商家详情/工作台 →「创建/编辑画像」（`/dashboard/merchants/[id]/profile`）。这是后续诊断 / 策略 / 内容的**事实基底**。

| 字段 | 采集要点 |
|---|---|
| 行业细分（industryDetail）| 比 Merchant.industry 更具体 |
| 目标客群（targetCustomerSummary）| 给谁服务 |
| 核心 Offer / 卖点（coreOfferSummary）| **必须能让客户 3 秒理解**卖什么、好在哪 |
| 当前获客方式（currentAcquisitionSummary）| 现在客户从哪来（喂 Channel 器官）|
| 线上存在情况（onlinePresenceSummary）| 现有账号/Maps/阵地 |
| 增长目标（growthGoalSummary）| 商家自己的目标（约束后续 KPI）|
| 执行限制（executionLimitSummary）| 红线/不能做的事（喂 Fulfillment/Organization 弱信号）|
| 基准数据摘要（baselineDataSummary）| 口头概况，正式数字进 Baseline |

> ⚠️ **强调**：**Offer 要能 3 秒讲清**——讲不清就是 Offer 器官风险，照实记。**不知道的字段写"待补充"，不要编。**

---

## 第 6 章　Step 3 — Fill Baseline Metric（增长前基线）

**入口**：`/dashboard/merchants/[id]/baseline`。**没有基线，就无法证明增长**（MVS 的对照前提）。

| 字段 | 说明 |
|---|---|
| 周期（periodLabel）| 如 2026-05 / 2026 Q2 |
| 月营业额（monthlyRevenue）| 数字，可估 |
| 月客户数 / 月咨询数 / 月成交数 | monthlyCustomerCount / monthlyLeadCount / monthlyConversionCount |
| 客单价（averageOrderValue）| |
| 复购率（repeatCustomerRate）| |
| 粉丝数 / 评论数 / 平均评分 | followerCount / reviewCount / averageRating |
| 数据来源说明（sourceNote）| **来源必填**（呼应证据五要素之"有来源"）|
| 数据可信度（dataConfidence）| `unknown / low（口头估计）/ medium（有部分记录）/ high（有完整来源）`|

> ⚠️ **强调**：**数字字段会被系统校验**（非数字/负数会被拒、不写脏数据）。**低可信数据可以记录，但必须把 `dataConfidence` 标低 + 在 `sourceNote` 写清来源。** 没有基线不要急着引流（第 13 章）。

---

## 第 7 章　Step 4 — Fill Operating Capacity（履约与组织承接能力）

**入口**：工作台五器官区块 →「补充履约与组织信息 / 编辑经营承接能力」（`/dashboard/merchants/[id]/operating-capacity`）。**这一步决定"能不能放大流量"。**

**履约（Fulfillment）**：

| 字段 | 采集问题 |
|---|---|
| responseProcessSummary | 客户来了**谁接** |
| responseTimeSummary | **多久响应**（回复/到店）|
| bookingProcessSummary | 怎么**预约 / 接单** |
| serviceCapacitySummary | 一天能**承接多少**客户 |
| peakHourHandlingSummary | **高峰期**怎么处理 |
| fulfillmentRiskSummary | 履约风险 |
| customerExperienceRiskSummary | 客户体验风险 |

**组织（Organization）**：

| 字段 | 采集问题 |
|---|---|
| ownerDependencySummary | **老板是否单点故障** |
| staffRoleSummary | 员工角色 |
| delegationReadinessSummary | 是否**能委派**给别人 |
| standardProcessSummary | 是否有**标准流程/SOP** |
| trainingReadinessSummary | 是否能**培训**别人 |
| organizationRiskSummary | 组织风险 |

综合：operatingConstraintSummary（经营约束）、notes。状态默认 `draft`。

> ⚠️ **强调**：填了**风险字段**（fulfillment/organization risk），工作台对应器官会显示 **attention**（提示，不是判决）。填了承接能力字段，器官从"弱信号"升为 **signal**。**这不是评分、不是决策**，只是把弱信号变成可追溯事实。

---

## 第 8 章　Step 5 — Fill TB-001 Minimal Diagnosis（最小诊断）

**入口**：`/dashboard/merchants/[id]/diagnosis`。诊断应**承接上游事实**：Profile + Baseline + Operating Capacity + 访谈事实。

填写：

| 字段 | 要点 |
|---|---|
| diagnosisSummary | 诊断摘要 |
| growthProblemSummary | 增长问题（**现象→能力→根因**，见[诊断架构](./merchant-growth-diagnostic-architecture-v1.md)）|
| opportunitySummary | 机会点 |
| riskSummary | 风险 |
| recommendedNextStep | 推荐下一步 |

保存时系统记录当前 Profile / Baseline 的软引用（`sourceProfileId` / `sourceBaselineMetricId`）。

> ⚠️ **强调**：**诊断不是"建议合集"，而是根因判断**——找住增长最短板（瓶颈），而不是罗列一堆动作。无证据支撑的根因只能标"假设"。

---

## 第 9 章　Step 6 — Fill TB-002 ~ TB-006（最小填写目标）

**通用铁律：每个下游节点必须先看上游只读上下文，不能凭空填**（系统已在各节点页显示上游引用）。

- **TB-002 账号搭建**（`/account-setup`，承 TB-001）：平台计划、账号定位、命名/Bio/视觉/人设、Google Maps/联系方式、风险。
- **TB-003 素材采集**（`/materials`，承 TB-002）：素材分类、素材缺口、拍摄场景、人物/产品/信任/品牌故事素材、采集优先级、风险。
- **TB-004 内容运营**（`/content-operation`，承 TB-003）：内容定位、栏目方向、比例、发布频率、风格、内容禁区、前 30 天计划、风险。
- **TB-005 直播规划**（`/live-planning`，承 TB-004）：是否适合直播（可行性）、平台、目标、形式、主题、频率、人员要求、准备度、风险。
- **TB-006 引流转化**（`/lead-conversion`，承 TB-004 + TB-005 双上游）：引流路径、转化路径、私域、活动、Google Maps 动作、投流测试方向、P-001 准备度、30 天动作、**归因方式**、转化风险。

> ⚠️ **强调**：**TB-006 的"归因方式"务必尽早想清**——它决定后续 ROI / MVS 能不能算账（现金流器官 + [MVS 归因框架](./merchant-validation-system-architecture-v1.md)）。归因不清就标缺口。

---

## 第 10 章　Step 7 — Fill TB-007 / TB-008 When Applicable（适时填写）

- **TB-007 数据复盘**（`/data-review`）：**不是接入第一天就完整填**——复盘要有真实执行结果（E1）才有意义。
- **TB-008 90 天计划**（`/growth-plan`）：**没有复盘依据时不应强行填满**。

试点初期可用 **`draft`** 先记录：
- 初步复盘假设（待真实结果验证）
- 初步 90 天方向（待复盘修正）
- 后续待验证项（显式标"待验证"）

> ⚠️ **强调**：**不要为了"链路完整"制造虚假复盘**。无真实结果的"成功复盘"按证据宪法一律拒绝（[经验准入](./evidence-framework-specification-v1.md)）。链路里允许有 draft / missing，这是诚实，不是缺陷。

---

## 第 11 章　Using Merchant Workspace（工作台怎么用）

**入口**：商家列表「工作台」/ 详情页「打开工作台」（`/dashboard/merchants/[id]/workspace`）。工作台是接入期的**主操作台**：

1. **看完整链路状态**：Profile → Baseline → TB-001~008 每节点 `missing / draft / completed / archived`。
2. **找第一个 missing 节点**：工作台给"建议优先补齐 X"的**规则提示**（按链路顺序，不是 AI 决策）。
3. **看五器官经营健康摘要**：Channel / Offer / Fulfillment / Cashflow / Organization，状态 `signal / attention / missing / unknown`，含观察 / 数据来源 / 数据缺口 / 非决策下一步。
4. **判断履约 / 组织 / 现金流缺口**：`missing/unknown` = 去采集；`attention` = 有风险信号要关注。
5. **进入各节点编辑**：每行/每器官有快速入口。
6. **不要把工作台提示当系统决策**：所有提示都是"建议 / 可考虑 / 不代表业务决策"。**人来判断、人来定。**

---

## 第 12 章　Pilot Readiness Checklist（试点就绪检查清单）

> 内部人员在"是否进入执行/试点"前，逐项核对（**核对 ≠ 放行**；放行在第 15 章的人工决策点）：

- [ ] **Merchant 已创建**（主体 + 联系方式）
- [ ] **Profile 已填写**（尤其 Offer 能 3 秒讲清）
- [ ] **Baseline 已填写或已标注缺失**（含 sourceNote + dataConfidence）
- [ ] **Operating Capacity 已填写**（履约 + 组织）
- [ ] **TB-001 诊断已填写**（根因，非建议合集）
- [ ] **TB-002 ~ TB-006 至少有 draft**
- [ ] **五器官中没有明显未记录的高风险缺口**（attention 的风险已写清来源）
- [ ] **关键数据缺口已标注**（不是脑补填上）
- [ ] **归因方式已初步考虑**（TB-006 attributionMethod）
- [ ] **项目负责人已人工确认**

> 清单全绿 ≠ 自动进入试点；它只是把"依据是否齐"摆给人看。

---

## 第 13 章　When Not To Scale Traffic（哪些情况不应急着引流）

出现以下任一，**先补能力、不要急着放大流量**：

- 没有清晰 **Offer**（客户 3 秒讲不清）
- 没有 **Baseline**（无法证明增长）
- 没有**响应流程** / 商家**接不住咨询**（履约漏血）
- **老板单点**严重（组织漏血）
- **活动会亏钱** / 单位经济为负（现金流漏血）
- **归因方式不清楚**（ROI 算不清）
- 商家**无法配合复盘**（无法验证）

> ⚠️ **强调**：**"不适合放大流量" ≠ "不合作"**。多数情况是"**先补能力，再增长**"——把履约 / Offer / 账本 / 组织补齐，再开引流。往漏血系统灌流量 = 风险放大器（见 [OHC 架构](./merchant-operating-health-check-architecture-v1.md)）。

---

## 第 14 章　Evidence Discipline（证据纪律）

**所有信息必须标注来源**（写进对应字段的 summary / sourceNote / notes）。区分这几类来源：

| 来源类型 | 例子 | 证据级 |
|---|---|---|
| 商家口述 | 老板说"大概月入 5 万" | E1（须标"口述/估计"）|
| 现有记录 | 商家给的台账 | E1（较硬）|
| 平台截图 | 后台数据截图 | E1/E2 |
| 经营数据 | 真实营业/客流 | E1（最硬）|
| 执行观察 | 我方采集观察 | E1 |
| 待验证假设 | "可能适合直播" | **E0（只能标假设）** |

**禁止**：
- ❌ 编数据
- ❌ 替商家美化
- ❌ 把猜测写成事实（最严重违规：谎报证据级别）
- ❌ 为推进流程而忽略缺口

> 标注口径建议：高可信写事实，低可信写"（口述/估计，待验证）"，缺失写"待补充"。让后面看的人一眼知道"这条有多硬"。

---

## 第 15 章　Human Decision Points（人类决策点）

以下**必须由人决策**，系统与本手册只提供依据：

| 决策 | 归属 |
|---|---|
| 是否签约 / 是否收费 | 商务 / 管理层 |
| 是否投入资源 | 项目负责人 / 管理层 |
| 是否进入试点 / 是否暂停 | 项目负责人 |
| **是否放大流量** | 项目负责人（参考第 13 章）|
| 是否进入 **MVS** | 项目负责人（需 Baseline + 归因就绪）|
| 是否进入下一轮 | 项目负责人 |

> 系统的角色：让证据充分、缺口清晰、风险可见、判断就绪。**决策与放行永远在人。**

---

## 第 16 章　Final Conclusion（结语）

> **真实商家试点不是把表填满。**
> 而是：**把一个商家的经营事实、增长基础、承接能力、风险缺口、下一步路径，清楚、诚实、可追溯地放进系统。**

填满但全是编的表 = 负资产（污染后续诊断/MVS/经验）。**有缺口但每条都真、每个缺口都标清**的接入 = 真资产。接入做对了，后面的诊断、执行、验证、复盘、经验沉淀才有干净的地基。

---

## 架构结论（≥10 条）

1. **接入的产物是"干净的商家资产"，不是"填满的表单"**——可追溯的事实 + 标清的缺口 > 编出来的完整。
2. **八原则的次序就是接入次序**：先事实→先基线→先承接→先小闭环；缺口照记，人做决策。
3. **创建顺序**：Merchant 主体 → Profile → Baseline → Operating Capacity → TB-001 → TB-002~006 →（适时）TB-007/008。
4. **Operating Capacity 是这版接入的关键升级**：履约/组织从弱信号变成可采集事实，直接回答"能不能放大流量"。
5. **没有 Baseline 不谈增长，没有承接能力不谈引流，没有归因不谈 ROI**——这是不可绕过的三道前置。
6. **工作台 + 五器官摘要是接入期主操作台**：看链路、找缺口、看风险方向；其提示是规则，不是决策。
7. **TB-007/008 允许 draft / missing**：诚实的不完整 > 虚假的完整；无真实结果的复盘一律拒绝。
8. **证据纪律是接入的生命线**：标来源、分级别、不谎报；E0 假设显式标注，绝不伪装成事实。
9. **"不适合放大流量" ≠ "不合作"**：常是"先补能力再增长"；系统暴露漏血点，人决定补法与节奏。
10. **人类决策点不可让渡**：签约/收费/投入/试点/放量/进 MVS 全在人；系统只提供依据（Human Commercial Authority）。
11. **接入即为后续留依据**：每个字段、每条来源、每个缺口，都是 MVS 归因、复盘、经验沉淀的原料。
12. **这是 V1 SOP，不是终态**：随真实试点反馈迭代（如履约/组织风险高亮、诊断纳入承接维度）。

> **成功标准自检**：本手册让内部人员知道——如何接入真实商家、每个模块该填什么、哪些信息不能编、什么时候不该急着引流、工作台与五器官如何使用、人类决策点在哪里。**这是 TOT 第一次拥有面向真实商家的内部接入操作手册（V1）。**

> 本文为只读业务文档（内部 SOP），**未改动任何代码 / schema / migration / 既有业务文档**；按 CHANGE_POLICY 属"新增文档（低风险）"。系统只提供依据、不拍板，关键决策与放行均在人工。
