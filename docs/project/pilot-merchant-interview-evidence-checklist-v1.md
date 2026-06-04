# Pilot Merchant Interview & Evidence Checklist V1（首批真实商家·访谈提纲与证据采集清单）

> 类型：**线下采集工具（访谈提纲 + 证据清单）· 纯文档**　｜　日期：2026-06-04　｜　任务：TASK-049
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不新增功能 / 不创建任何商家 / 不写数据库 / 不实现 AI·MVS·Workflow**。本文只输出文档。
> 读者：**线下采集人员 / 运营 / 项目负责人**——首次接触真实商家时使用。
> 上承（须保持一致）：[pilot-merchant-intake-playbook-v1](./pilot-merchant-intake-playbook-v1.md) · [pilot-readiness-gate-v1](./pilot-readiness-gate-v1.md) · [merchant-operating-health-check-architecture-v1](./merchant-operating-health-check-architecture-v1.md) · [evidence-framework-specification-v1](./evidence-framework-specification-v1.md) · [merchant-validation-system-architecture-v1](./merchant-validation-system-architecture-v1.md) · [PROJECT_STATE](./PROJECT_STATE.md)

---

## ⚠️ 两条贯穿全文的最高约束

1. **Human Commercial Authority**：访谈只**采集依据**，**不决定**是否合作 / 收费 / 进入试点 / 放量——这些由商务 / 项目负责人 / 管理层决定。
2. **Evidence-Based（证据驱动）**：所有记录须能回答[证据问责五问](./evidence-framework-specification-v1.md)（依据/来源/可信度/是否验证/可否追溯）。**核心铁律：宁可留空，不可编造。**

---

## 第 1 章　Purpose（目的）

本清单回答一件事：**线下人员第一次见真实商家，如何把"可录入系统的事实、证据、缺口、风险"干净地采回来。**

它**不是**：❌ 销售话术　❌ 合同材料　❌ AI 自动诊断问卷。
它**是**：一份**访谈提纲 + 证据采集清单**，让采集回来的信息**可追溯、可分级、可直接映射进系统字段**。

> **核心原则：宁可留空（写"待补充"），不可编造。** 一张全是编的表是负资产，会污染后续诊断 / MVS / 经验。

---

## 第 2 章　Interview Principles（访谈十原则）

1. **先听事实，再做判断**——别急着给方案。
2. **问清来源，不只问答案**——"这个数字哪来的？"
3. **允许"不知道"**——不知道是有效信息。
4. **允许"待补充"**——可第二次访谈再采。
5. **口述可记录，但要标"口述/估计"**——别当成硬数据。
6. **经营数据必须问来源**——台账？后台？记忆？
7. **风险不要美化**——红旗照实记（第 14 章）。
8. **不承诺虚假增长**——TOT 诚实交付。
9. **不把访谈变成销售压迫**——采集 ≠ 逼单。
10. **系统提供依据，人做商业决策**。

---

## 第 3 章　Basic Merchant Information（基础信息 · 对应 Merchant）

| 采集项 | 必须/可后补 | 映射 |
|---|---|---|
| 商家名称 | **必须** | Merchant.name |
| 行业 | **必须** | Merchant.industry |
| 城市 / 国家 | **必须** | Merchant.city / country |
| 联系人 | **必须** | Merchant.contactName |
| 联系方式（电话/邮箱）| **必须** | Merchant.contactPhone / contactEmail |
| 当前合作意向 | **必须**（线下判断）| —（线下记录，决定是否创建）|
| 是否愿意配合资料采集 | **必须** | Merchant.notes / 线下记录 |
| 是否愿意配合复盘 | **必须** | Merchant.notes / 线下记录 |
| 备注 | 可后补 | Merchant.notes |

> 创建主体后，**诊断/画像/经营信息不要塞进 notes**——它们有各自的资产节点。

---

## 第 4 章　Merchant Profile Questions（画像问题 · 对应 MerchantProfile）

| 访谈问题 | 映射字段 |
|---|---|
| 你主要服务哪类客户？ | targetCustomerSummary |
| 客户为什么选择你？你最核心的产品/服务是什么？ | coreOfferSummary |
| **客户 3 秒内能不能理解你卖什么？**（采集员自评 + 商家答）| coreOfferSummary（讲不清→记为风险）|
| 现在主要靠什么获客？ | currentAcquisitionSummary |
| 现在有哪些线上渠道（账号/Maps/私域）？ | onlinePresenceSummary |
| 你希望增长什么？ | growthGoalSummary |
| 有哪些不能做 / 不想做 / 有限制的事？ | executionLimitSummary |
| 行业细分 / 已有基线概况（口头）| industryDetail / baselineDataSummary |

> **录入页**：`/dashboard/merchants/[id]/profile`。不知道就写"待补充"，**别编**。

---

## 第 5 章　Baseline Metric Questions（基线问题 · 对应 MerchantBaselineMetric）

| 采集项 | 映射字段 |
|---|---|
| 近一个月营业额 | monthlyRevenue |
| 近一个月客户数 / 咨询数 / 成交数 | monthlyCustomerCount / monthlyLeadCount / monthlyConversionCount |
| 客单价 / 复购率 | averageOrderValue / repeatCustomerRate |
| 粉丝数 / 评论数 / 平均评分 | followerCount / reviewCount / averageRating |
| 统计周期 | periodLabel |
| **数据来源**（台账/后台/记忆）| sourceNote |
| **数据可信度** | dataConfidence（unknown/low/medium/high）|

> ⚠️ **必须说明**：
> - **如果只是老板估计 → 可信度不能写 high**（写 low / medium，并在 sourceNote 注明"口述/估计"）。
> - **如果没有数据 → 写"待补充"，不要编。**
> - **录入页**：`/dashboard/merchants/[id]/baseline`（数字字段会被系统校验，非数字/负数会被拒）。

---

## 第 6 章　Operating Capacity Questions（承接能力问题 · 对应 MerchantOperatingCapacity）

> **这一步决定"能不能放大流量"。** 接不住的引流是风险放大器。

**履约（Fulfillment）**：

| 访谈问题 | 映射字段 |
|---|---|
| 客户咨询后**谁回复**？ | responseProcessSummary |
| 平均**多久回复**？ | responseTimeSummary |
| 怎么**预约 / 接单**？ | bookingProcessSummary |
| 一天**最多能稳定接多少**客户？ | serviceCapacitySummary |
| **高峰期**怎么处理？ | peakHourHandlingSummary |
| 哪个环节最容易出错？ | fulfillmentRiskSummary |
| 客户体验最怕出什么问题？ | customerExperienceRiskSummary |

**组织（Organization）**：

| 访谈问题 | 映射字段 |
|---|---|
| 老板是否必须**亲自处理大多数事**？ | ownerDependencySummary |
| 员工有哪些角色？ | staffRoleSummary |
| 哪些事可以**交给别人**？ | delegationReadinessSummary |
| 是否有**标准流程**？ | standardProcessSummary |
| 新人**能不能被培训**？ | trainingReadinessSummary |
| **老板离开一天，业务会不会停**？ | organizationRiskSummary |

> **录入页**：`/dashboard/merchants/[id]/operating-capacity`。填了 risk 字段，工作台对应器官会显 **attention**（提示，非判决）。

---

## 第 7 章　TB-001 Diagnosis Questions（诊断自述问题 · 用于 MerchantDiagnosis）

| 访谈问题 | 用途 |
|---|---|
| 你认为现在**最大增长问题**是什么？ | growthProblemSummary（商家自述）|
| 客流少 / 咨询少 / 成交少，**哪个最明显**？ | 定位漏斗瓶颈 |
| 你觉得**原因**是什么？ | 根因线索（待验证）|
| 你**最想优先解决**什么？ | opportunitySummary |
| 最近有没有明显变化？ | 背景 |
| 你**最担心什么风险**？ | riskSummary |

> ⚠️ **注意**：这是**商家自述（E1）**，**不等于系统诊断结论**。系统的 `diagnosisSummary` / `recommendedNextStep` 是采集员/分析后基于上游（Profile+Baseline+Operating Capacity）做的判断，缺证据时写"待验证"。

---

## 第 8 章　TB-002 Account Setup Questions（账号搭建 · MerchantAccountSetup）

| 访谈问题 | 映射字段 |
|---|---|
| 目前有哪些平台账号？哪些还没有？ | platformPlanSummary |
| Google Maps 是否已建立？ | googleMapsDirectionSummary |
| 联系方式是否统一？ | contactChannelSummary |
| 商家希望对外呈现什么**定位**？ | accountPositioningSummary |
| 命名 / Bio / 头像 / 视觉是否已有想法？ | namingDirection / bioDirection / visualDirectionSummary / personaDirectionSummary |
| 搭建风险 | setupRiskSummary |

---

## 第 9 章　TB-003 Material Collection Questions（素材采集 · MerchantMaterialCollection）

| 访谈问题 | 映射字段 |
|---|---|
| 店面 / 环境是否方便拍摄？ | shootingSceneSummary |
| 有哪些产品 / 服务可以拍？ | productServiceMaterialSummary |
| 有哪些人物可以出镜？ | peopleMaterialSummary |
| 有哪些客户**信任素材**（评价/案例/前后对比）？ | trustMaterialSummary |
| 有无**品牌故事**？ | brandStoryMaterialSummary |
| 现有素材分类 / 缺口 | materialCategorySummary / materialGapSummary |
| 哪些素材**暂时无法采集**？ | collectionRiskSummary / collectionPrioritySummary |

---

## 第 10 章　TB-004 Content Operation Questions（内容运营 · MerchantContentOperation）

| 访谈问题 | 映射字段 |
|---|---|
| 商家能接受什么**内容风格**？ | toneStyleSummary |
| 哪些内容**不能做**（禁区）？ | contentBoundarySummary |
| 每周能配合多少内容采集（频率）？ | publishingFrequencySummary |
| 客户最常问的问题是什么？ | contentPillarSummary（栏目线索）|
| 商家最想让客户知道什么？ | contentPositioningSummary |
| 过去发过效果好的内容？ | first30DayPlanSummary（参考）/ contentRatioSummary |
| 内容风险 | contentRiskSummary |

---

## 第 11 章　TB-005 Live Planning Questions（直播规划 · MerchantLivePlanning）

| 访谈问题 | 映射字段 |
|---|---|
| 是否**愿意直播**？ | feasibilitySummary |
| **谁能出镜**？ | hostPeopleRequirementSummary |
| 能接受什么**直播形式**？ | liveFormatSummary |
| 一周最多能做几次？ | liveFrequencySummary |
| 哪些时间段合适 / 主题 / 目标 | liveTopicSummary / liveGoalSummary / platformSummary |
| 最担心直播什么风险？ | liveRiskSummary |
| 当前是否具备**直播准备度**？ | readinessSummary |

---

## 第 12 章　TB-006 Lead Conversion Questions（引流转化 · MerchantLeadConversion）

| 访谈问题 | 映射字段 |
|---|---|
| 客户从看到内容到咨询，**路径**是什么？ | trafficPathSummary |
| 咨询后**怎么转化**？ | conversionPathSummary |
| 是否有**私域**（WhatsApp/WeChat/Line/Messenger）？ | privateDomainSummary |
| 是否能用**专属优惠码 / 预约方式**？ | campaignIdeaSummary / googleMapsActionSummary |
| 是否能**追踪客户来源**？ | attributionMethodSummary |
| 是否愿意**小额测试投流**？ | paidTrafficTestSummary / p001ReadinessSummary |
| 当前**归因方式**是什么？ | attributionMethodSummary |
| 30 天动作 / 转化风险 | thirtyDayActionSummary / conversionRiskSummary |

> ⚠️ **强调**：**没有归因方式，不急着投流**（否则 ROI 算不清，MVS 无法验证）。归因不清就标"待补充"。

---

## 第 13 章　Evidence Collection Checklist（证据采集清单）

> 尽量带回**可追溯证据**（截图/照片/记录）。每项标注：必须/可选 · 对应系统模块 · 可信度建议。

| 证据 | 必须/可选 | 对应模块 | 可信度建议 |
|---|---|---|---|
| 门店 / 环境照片 | 可选 | Material(TB-003) | E1（实拍）|
| 产品 / 服务照片 | 可选 | Material(TB-003) | E1 |
| 菜单 / 价格表 | **必须** | Profile(Offer) | E1（强，证 Offer 清晰）|
| Google Maps 截图 | **必须** | AccountSetup / Channel | E1/E2 |
| 社媒账号截图 | **必须** | Profile / AccountSetup | E1 |
| 评论 / 评分截图 | 可选 | Baseline(reviewCount/rating) | E1/E2 |
| **近一个月营业数据** | **必须**（或标缺失）| Baseline | E1（最硬，须问来源）|
| 预约 / 咨询记录截图 | 可选 | OperatingCapacity / Baseline(lead) | E1 |
| 现有活动记录 | 可选 | LeadConversion(TB-006) | E1 |
| 客户常见问题 | 可选 | ContentOperation(TB-004) | E1 |
| 老板口述记录 | **必须**（标"口述"）| 全链 | **E1 低可信**（须标口述）|
| 员工角色说明 | 可选 | OperatingCapacity(组织) | E1 |

> **口径**：实拍/后台截图 = 较硬 E1；口述/记忆 = 低可信 E1（必标"口述/估计"）；外部平台数据 = E2（须带来源+时间）。

---

## 第 14 章　Red Flags（必须记录的风险信号）

出现以下任一，**如实记录**（写进对应字段的 risk / executionLimit / notes）：

- ⛳ 不能提供**任何经营数据**
- ⛳ **Offer 说不清**（客户 3 秒看不懂）
- ⛳ **价格不清**
- ⛳ 没有**响应流程**（没人接咨询）
- ⛳ **老板严重单点**（离开一天就停）
- ⛳ **客户来了也接不住**（产能不足）
- ⛳ **无法配合复盘**
- ⛳ **不愿意追踪来源**（无法归因）
- ⛳ **只想马上投流**（跳过承接/基线）
- ⛳ **要求保证结果**（与诚实交付冲突）
- ⛳ **不愿面对真实问题**

> ⚠️ **红旗不是自动拒绝合作**——它是**人工决策依据**。多数红旗意味着"**先补能力，再增长**"，而不是"不做"。

---

## 第 15 章　System Mapping Table（系统映射总表）

> 列：采集主题 / 关键证据 / 对应系统字段或模块 / 录入页面 / 是否必填 / 可否后补。

| 采集主题 | 关键证据 | 系统字段 / 模块 | 录入页面 | 必填 | 可后补 |
|---|---|---|---|:--:|:--:|
| 主体信息 | 联系方式 | Merchant.* | `/merchants/new` | ✅ | 部分 |
| 客群/Offer/获客/线上/目标/限制 | 菜单/截图 | MerchantProfile.* | `/[id]/profile` | ✅(Offer) | ✅ |
| 经营基线 | 营业数据/截图 | MerchantBaselineMetric.* | `/[id]/baseline` | ✅(或标缺) | ✅ |
| 履约 + 组织承接 | 咨询/排班记录 | MerchantOperatingCapacity.* | `/[id]/operating-capacity` | ✅ | ✅ |
| 增长问题自述 | 口述 | MerchantDiagnosis.*（TB-001）| `/[id]/diagnosis` | 建议 | ✅ |
| 平台账号现状 | 账号/Maps 截图 | MerchantAccountSetup.*（TB-002）| `/[id]/account-setup` | 可选 | ✅ |
| 素材可采性 | 照片 | MerchantMaterialCollection.*（TB-003）| `/[id]/materials` | 可选 | ✅ |
| 内容配合度 | 风格/禁区 | MerchantContentOperation.*（TB-004）| `/[id]/content-operation` | 可选 | ✅ |
| 直播意愿/准备度 | 口述 | MerchantLivePlanning.*（TB-005）| `/[id]/live-planning` | 可选 | ✅ |
| 引流转化 + **归因** | 私域/来源追踪 | MerchantLeadConversion.*（TB-006）| `/[id]/lead-conversion` | 建议(归因) | ✅ |
| 链路总览 + 经营健康 | —（系统生成）| Workspace / 五器官 OHC | `/[id]/workspace` | —(只读) | — |

> TB-007 复盘 / TB-008 计划**接入首日不采**（需真实执行结果后再 draft，见 [Playbook 第 10 章](./pilot-merchant-intake-playbook-v1.md)）。

---

## 第 16 章　After Interview Checklist（访谈后核对清单）

访谈结束，线下人员逐项确认：

- [ ] 哪些信息**可立即录入**（事实清晰）
- [ ] 哪些信息**待补充**（标清缺口）
- [ ] 哪些数据**可信度低**（标 low + 口述来源）
- [ ] 哪些**风险必须标记**（红旗写进对应字段）
- [ ] 是否具备**小试点条件**（参考 [Readiness Gate](./pilot-readiness-gate-v1.md) 的 Conditional Go 条件）
- [ ] 是否**不应立刻引流**（Offer/基线/承接/归因任一缺 → 先补）
- [ ] 是否需要**项目负责人确认**（商业决策点）
- [ ] 是否需要**第二次访谈**（关键事实仍缺）

---

## 第 17 章　Final Conclusion（结语）

> **访谈的目标不是让商家看起来完美，而是让系统看到真实的商家。**

一个有缺口、但每条都真、每个缺口都标清的访谈记录，远胜一份填满却失真的表。**采集做对了**，后面的诊断、执行、验证、复盘、经验沉淀，才有干净的地基。

---

## 架构结论（≥10 条）

1. **访谈的产物是"可追溯的事实 + 标清的缺口 + 记录的风险"**，不是"看起来完整的答案"。
2. **十原则的核心是"先事实、问来源、允许不知道、不美化风险"**——宁可留空，不可编造。
3. **每个采集主题都有明确的系统字段映射**（第 15 章总表），采回即可对号入座录入。
4. **基线数据必问来源 + 标可信度**：老板估计不能写 high，无数据写"待补充"。
5. **承接能力（履约+组织）是"能否放量"的关键采集块**——直接回答风险放大器问题。
6. **归因方式要在 TB-006 尽早问清**——没有归因不投流（MVS/ROI 前提）。
7. **TB-001 是商家自述（E1），不是系统诊断结论**——两者必须区分。
8. **TB-007/008 接入首日不采**——无真实结果不造复盘/计划。
9. **红旗是人工决策依据，不是自动拒绝**——多数指向"先补能力再增长"。
10. **证据分级随采随标**：实拍/后台=较硬 E1，口述=低可信 E1，外部平台=E2（带来源时间）。
11. **访谈后必须做"可录入/待补充/低可信/风险/是否引流/是否需复访"的结构化收尾**。
12. **系统提供依据，人做商业决策**——是否合作/收费/试点/放量，全在人（Human Commercial Authority）。

> **成功标准自检**：本清单让线下人员知道——第一次问商家什么、哪些要证据、哪些可待补充、哪些不能编、如何映射到系统字段、哪些红旗要记录。**未来真实商家来时，不会临场乱问。**

> 本文为只读线下采集工具文档；按 CHANGE_POLICY 属"新增文档（低风险）"。**未改动任何代码 / schema / migration / 数据库 / 真实数据。** 系统只提供依据、不拍板，关键决策与放行均在人工。
