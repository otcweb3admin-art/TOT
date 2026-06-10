# Multi-AI Capability & Workflow Integration Blueprint V1（多 AI 能力与工作流集成蓝图）

> 类型：**纯业务 / 产品 / AI 能力架构设计文档**　｜　日期：2026-06-11　｜　任务：TASK-069
> 范围：**只设计、不实现**——不改代码 / schema / migration,不接任何 AI API,不建 provider/后台 job,不创建账号/商家。本文"AI 工作流"仅指业务流程设计。
> 上承：[账户分权与工作流蓝图](./account-role-workflow-system-design-v1.md) · [证据宪法 E0–E3](./evidence-framework-specification-v1.md) · [AIGO AI 组织架构](./ai-growth-organization-architecture-v1.md)（Researcher/Analyst/Planner/Auditor 四职能 + 9 AI 角色）· [P2 Freeze](./p2-pre-pilot-system-freeze-handoff-summary-v1.md) · [RC Verification](./production-release-candidate-verification-v1.md) · 现有 `ai-workbench`（tasks/context/prompts,7 类任务雏形）

> ⚠️ 贯穿全文不变约束：**AI 输出永远是草稿/建议/素材,不是最终决策;人工审核通过才进入下一步;客户只见审核后结果;外包只见审核后 brief;所有 AI 结果保留来源/上下文/版本/审核记录;不承诺增长结果（Human Commercial Authority）。**

---

## Chapter 1：Executive Summary

**目标**：把 TOT 从"单一 AI 草稿工具"（现 ai-workbench V0:一个商家+7 类任务+复制 Prompt）升级为 **"多 AI 专职协同的线上代运营智能系统"**——在每个业务节点调用对的 AI 能力,产出进入统一的"草稿→人工审核→流转"管道。

**核心原则**：① 每类 AI 只做自己擅长的任务 ② AI 输出=草稿,非决策 ③ 人工审核通过才进下一步 ④ 客户不见内部 AI 草稿 ⑤ 外包只见审核后 brief ⑥ 所有 AI 结果留来源/上下文/版本/审核记录。

## Chapter 2：Why Multi-AI Is Needed

一个通用 AI 聊天框覆盖不了：市场调研要**信息收集**力 · 平台规则要**规则研判**力 · 商家诊断要**经营分析**力 · 文案要**表达转化**力 · 图片要**视觉生成**力 · 视频要**脚本/分镜/剪辑**力 · 复盘要**结构化分析**力 · 审核要**风险识别+证据纪律**力。能力模型、上下文需求、输出形态、审核标准各不相同。

> **结论**：TOT 不是"一个 AI 聊天框",而是**"在不同业务节点调用不同 AI 能力"**——这与 AIGO"组织而非超级 AI、生产与审计分离"的原则一脉相承。

## Chapter 3：AI Capability Categories（12 类 AI 能力）

> 与 AIGO 9 角色的关系：1↔Market Research AI,2↔Platform Intelligence AI,3↔Growth Analyst AI,4↔Strategy/Campaign Planner AI,5↔Content Architect AI,11↔Validation Analyst AI,12↔Risk+Evidence Auditor AI;**6-10 为本蓝图新增的执行层能力**（文案/生图/视频/剪辑/外包 brief）。

| # | 能力 | 负责 | 输出 |
|---|---|---|---|
| 1 | **Market Intelligence AI** | 行业信息收集·本地市场观察·竞品整理·客群趋势·价格区间·消费场景 | 市场信息摘要·竞品观察表·客群洞察·机会点·风险提示（E2,须来源+时间）|
| 2 | **Platform Rules AI** | TikTok/Douyin/IG/FB/YouTube/Maps/小红书规则研判·内容限制·账号风险·广告规则·合规提示 | 平台规则摘要·禁止事项·内容风险·运营建议·发布注意（E2,高时效）|
| 3 | **Merchant Diagnosis AI** | Profile/Baseline/Capacity 分析·五器官诊断·短板判断·是否适合马上引流·待补充识别 | 诊断草稿·风险与缺口·下一步建议·不应立即做的动作 |
| 4 | **Strategy Planning AI** | 增长策略草案·阶段计划·优先级·90 天计划·资源需求 | 策略草案·阶段目标·执行优先级·90 天计划草稿 |
| 5 | **Content Planning AI** | 内容方向·栏目·短视频/图文选题·发布节奏·内容矩阵 | 内容方向·内容系列·选题清单·发布计划·素材需求 |
| 6 | **Copywriting AI** | 社媒文案·标题·活动文案·私域话术·咨询回复模板·客户确认说明 | 文案草稿·多版本标题·客户话术·CTA·私域模板 |
| 7 | **Image Generation AI** | 海报/活动/产品图·风格参考·门店视觉·社媒封面 | 生图 prompt·风格 brief·视觉方向·生图结果·外包设计参考（**结果必人工审核,不得直接发布**）|
| 8 | **Video Script AI** | 视频脚本·分镜·口播稿·拍摄清单·镜头建议·剪辑节奏 | 脚本·分镜表·口播稿·拍摄要求·剪辑 brief |
| 9 | **Video Production/Editing AI** | 自动剪辑建议·字幕生成·片段整理·节奏建议·模板·多版本导出 | 剪辑要求·字幕文案·成片草稿·剪辑反馈·版本对比 |
| 10 | **Outsource Brief AI** | 外包任务说明·验收标准·交付格式·素材说明·注意事项·修改意见草稿 | 外包 brief·验收标准·修改意见·交付清单 |
| 11 | **Data Review AI** | 执行数据整理·线索分析·内容表现·转化观察·复盘草稿 | 数据摘要·复盘草稿·问题归因·下阶段建议·不确定项 |
| 12 | **Audit / Risk AI** | 证据纪律检查·编造检测·承诺增长检测·越权检测·DEMO/UAT 误用·风险遗漏 | 审核风险提示·证据缺口·修改建议·禁止提交提醒（**只提示,不批准**）|

## Chapter 4：AI Usage By Business Stage（18 阶段 × AI 用法）

> 列：推荐 AI / 输入 / 输出 / 审核人 / 重生成 / 交外包 / 客户可见 / 禁止。审核人除注明外均为 **Reviewer（审核员）**;全部允许退回重生成;"客户可见"均指**审核后**版本。

| # | 阶段 | 推荐 AI | 输入 | 输出 | 交外包 | 客户可见 | 禁止 |
|---|---|---|---|---|---|---|---|
| 1 | 候选商家接触前 | 1 市场 + 2 平台 | 行业/城市/平台 | 市场摘要·平台规则要点 | 否 | 否 | 把摘要当承诺话术 |
| 2 | 资料采集后 | 12 审计(完整性) | 采集包 | 缺口提醒·补问清单 | 否 | 补问可转客户 | 用 AI 填空代替补采 |
| 3 | Profile 完成后 | 3 诊断(预检) | 画像 | 画像完整性观察 | 否 | 否 | 凭画像下结论 |
| 4 | Baseline 完成后 | 11 数据 | 基线+来源 | 基线摘要·可信度提示 | 否 | 否 | 低可信当事实 |
| 5 | Capacity 完成后 | 3 诊断(承接) | 承接数据 | 承接风险观察 | 否 | 否 | 掩饰承接风险 |
| 6 | 商家诊断 | **3 诊断** | 画像+基线+承接+五器官 | TB-001 草稿 | 否 | 审核后结论可转译给客户 | 无证据写确定结论 |
| 7 | 账号搭建 | 2 平台 + 4 策略 | 诊断+平台规则 | 账号建议(TB-002) | 部分(建号执行) | 审核后 | 违反平台规则 |
| 8 | 素材采集 | 5 内容 + 10 brief | 卖点+场景 | 素材清单(TB-003)·拍摄要求 | 是(拍摄) | 需客户配合拍摄 | 虚构素材 |
| 9 | 内容策划 | **5 内容** | 诊断+素材+平台规则 | 内容方向(TB-004)·选题·节奏 | 否 | 审核后方案需客户确认 | 承诺爆款 |
| 10 | 图片制作 | **7 生图** + 6 文案 | 视觉 brief | prompt·候选图·海报文案 | 是(设计) | 审核后待确认 | 侵权/误导效果图 |
| 11 | 视频制作 | **8 脚本 + 9 剪辑** | 内容方向+素材 | 脚本·分镜·剪辑要求·字幕 | 是(拍剪) | 审核后待确认 | 虚假效果·盗用素材 |
| 12 | 文案生成 | **6 文案** | 卖点+平台+场景 | 各类文案草稿 | 部分 | 审核后待确认 | 夸大/违规表述 |
| 13 | 外包任务生成 | **10 brief** | 已审方案 | brief·验收标准 | —（产物即给外包）| 否 | 泄露经营数据进 brief |
| 14 | 外包成果审核 | 12 审计(初检) | 提交物 vs 验收标准 | 初检意见·修改意见草稿 | 退回外包 | 否 | AI 初检代替人工验收 |
| 15 | 客户确认 | 6 文案(确认说明) | 已审成果 | 客户确认文案·反馈摘要 | 否 | **是（本阶段产物即给客户）** | 给客户看未审草稿 |
| 16 | 发布前检查 | **12 审计 + 2 平台** | 待发布物料 | 合规/风险/版权检查单 | 否 | 否 | 未检查直接发布 |
| 17 | 数据复盘 | **11 数据** | 基线+真实结果 | TB-007 复盘草稿·归因观察 | 否 | 审核后摘要可同步客户 | 无真实数据强行复盘 |
| 18 | 90 天计划 | **4 策略** | 诊断+复盘+资源 | TB-008 计划草稿 | 否 | 审核后需客户确认 | 承诺增长数字 |

## Chapter 5：AI Button Matrix（AI 按钮矩阵）

> 每按钮统一规格：**谁可见=谁可点**（按角色）;读取上下文按 Ch.11 分级;输出一律先进 **AIDraft（待审核区）**;**全部需 Reviewer 审核**;通过后保存到目标节点/任务并由人提交下一步。

| 工作台 | 按钮 | 可见/可点 | 上下文 | AI 能力 | 输出去向（审核后）|
|---|---|---|---|---|---|
| **采集员** | 检查资料缺口 | collector | 本商家采集包 | 12 审计 | 待补充清单→采集任务 |
| | 生成补问清单 | collector | 缺口列表 | 12 审计 | 补问清单→Field Pack 复访 |
| **审核员** | 生成诊断草稿 | reviewer | 完整经营上下文 | 3 诊断 | TB-001 |
| | 生成风险提示 | reviewer | 五器官+承接 | 3+12 | 诊断风险区 |
| | 生成下一步建议 | reviewer | 诊断 | 4 策略 | 诊断/计划 |
| | 检查可否进下一阶段 | reviewer | 当前节点+证据 | 12 审计 | 审核辅助意见（不自动放行）|
| **内容阶段** | 生成内容方向 / 短视频选题 / 图文标题 / 发布计划 | reviewer | 诊断+素材+平台 | 5 内容(+6) | TB-004 |
| **图片阶段** | 生成图片 brief / 生图 prompt / 海报文案 | reviewer | 视觉相关上下文 | 7 生图+6 | 图片任务/外包 brief |
| **视频阶段** | 生成视频脚本 / 分镜 / 剪辑要求 / 字幕文案 | reviewer | 内容方向+素材 | 8+9 | 视频任务/外包 brief |
| **外包阶段** | 生成外包任务 brief / 验收标准 / 退回修改意见 | reviewer | **脱敏**任务上下文 | 10 brief | Assignment |
| **客户确认** | 生成客户确认说明 / 客户反馈摘要 | reviewer | 已审成果 | 6 文案 | ClientConfirmation 页 |
| **复盘阶段** | 生成复盘草稿 / 下阶段建议 | reviewer | 基线+真实数据 | 11 数据+4 | TB-007/008 |

## Chapter 6：AI Output Lifecycle（AI 输出生命周期）

`created 生成草稿 → edited 人工修改 → submitted_for_review 提交审核 → approved 通过 / rejected 退回 → regenerated 重新生成 → saved_to_node 保存到业务节点 → archived 归档`

硬规则：AI 输出**不能直接成为事实**;必须**绑定上下文版本**（AIContextSnapshot）;必须记录**任务类型、生成者、审核者**;必须**保留修改历史**（AIDraftVersion）;rejected 可携原因进入 regenerated,历史版本不删。

## Chapter 7：Human Review Rules（人工审核规则）

1. **所有 AI 结果必须人工审核**（无例外,含审计 AI 自己的输出）
2. 没证据的内容标「待验证」;**编造数据必须删除**
3. **增长结果不得承诺**
4. 图片/视频**不得侵犯版权**;不得使用未授权人物形象
5. **客户隐私不得暴露给外包**
6. 平台规则风险必须**人工复核**（规则 AI 输出有时效）
7. **客户确认前必须由审核员通过**;外包成果**审核后才能给客户看**

## Chapter 8：AI Access By Account Type（各账户 AI 权限）

| 账户 | 可用 AI | 不可用 / 边界 |
|---|---|---|
| **客户** | 一般**不直接调用**内部 AI;只见审核后成果/待确认内容/补充问题 | 内部 Prompt·未审草稿·诊断 AI |
| **采集员** | 资料缺口检查·补问清单（能力 12 子集）| 最终诊断·内容方案终稿·客户承诺类文案 |
| **审核员** | **全部主要草稿能力**（诊断/策略/内容/文案/生图 brief/视频/外包 brief/数据/审计）| 不得把 AI 输出当终稿直接外发 |
| **外包** | 只**见**审核后的 AI 参考 brief/素材方向/验收标准;如开放调用,仅限改自己交付物+辅助素材 | 不可调诊断 AI;不可访问完整经营数据 |
| **管理员** | 管理 AI 配置与使用记录 | 不作为日常 AI 生成账户 |
| `ai_worker` | —（AI 能力自身的系统标识,不开放真人）| — |

## Chapter 9：Provider-Agnostic AI Design（供应商无关设计）

未来可能接入：OpenAI / Claude / Gemini（文本）· Midjourney / DALL·E / Stable Diffusion（图）· Runway / Pika / CapCut AI / 剪映 AI（视频）· 其它数据分析工具。

**原则**：① 业务层只绑定**能力分类**（Ch.3）,不绑定 provider ② 同一能力可配多个 provider（主+备）③ 人工复制 Prompt 与 API 自动调用是**同一任务的两种执行方式**,可逐能力切换 ④ provider 失败可降级切换 ⑤ **任何 provider 的输出都进同一套审核流程**（Ch.6 生命周期）。

## Chapter 10：AI Task Registry（AI 任务注册表）

每个 AI 任务定义：`taskKey · 名称 · 业务阶段 · 适用角色 · 推荐 AI 能力 · 输入上下文(分级) · 输出结构 · 审核人 · 目标节点 · 允许重生成? · 外包可见? · 客户可见? · 禁止事项 · 保存位置`。

> 现有 `app/lib/ai-workbench/tasks.ts`（7 类:diagnosis/account_setup/materials/content_operation/lead_conversion/data_review/growth_plan,各含目标节点+输出结构+警告）即**最早期雏形**——已具备 taskKey/nodeLabel/outputStructure/warning 四要素;扩展方向=补「业务阶段/适用角色/能力分类/上下文分级/可见性/保存位置」字段并扩到 Ch.5 全按钮集。

## Chapter 11：AI Context Packaging（上下文打包分级）

上下文必须区分（对接证据宪法）：**商家事实(E1) · 口述信息(低可信 E1,标注) · 估计数据(标注) · 缺失数据(待补充) · 已完成/未完成节点 · 风险 · 客户可见信息 · 内部不可见信息 · 外包可见信息**。

不同 AI 拿不同包：

| AI | 上下文包 |
|---|---|
| 市场 AI | 行业/地区/竞品（**不含**商家私有经营数据）|
| 诊断 AI | 商家**完整**经营上下文（现 `buildAiMerchantContext` 即此包雏形）|
| 外包 Brief AI | **仅必要脱敏信息**（做活所需,无经营数据/内部风险原文）|
| 生图 AI | 仅视觉相关（卖点视觉表达/风格/尺寸）|
| 视频 AI | 仅脚本/素材/风格要求 |
| 客户确认文案 AI | **仅审核后的结论**（永不喂内部草稿/争议）|

## Chapter 12：Image AI Workflow（生图流程 10 步）

1. 审核员选商家+图片任务 → 2. 系统生成图片 brief → 3. AI 生成生图 prompt → 4. 生图 AI 产候选图 → 5. **人工筛选** → 6. 如需外包设计,生成外包设计 brief → 7. 外包提交成果 → 8. **审核员验收** → 9. **客户确认** → 10. 发布使用。

红线：不侵犯版权 · 不用未授权人物形象 · 不生成误导性效果 · **不把效果图当真实门店图** · 客户确认后才可发布。

## Chapter 13：Video AI Workflow（视频流程 11 步）

1. 内容方向确定 → 2. AI 生成脚本 → 3. AI 生成分镜 → 4. AI 生成拍摄清单 → 5. **人工审核** → 6. 交采集/拍摄/外包 → 7. 视频 AI 或外包剪辑出初版 → 8. **审核员审核** → 9. 退回修改或通过 → 10. **客户确认** → 11. 发布准备。

红线：脚本须符合平台规则 · 不承诺虚假效果 · 字幕/口播需人工确认 · 版权音乐/素材需检查 · **成片≠最终发布,须审核**。

## Chapter 14：Outsource + AI Collaboration（外包 × AI）

外包**见**：已审核任务 brief · 必要素材 · AI 参考方向 · 验收标准 · 截止时间 · 修改意见。
外包**不见**：完整经营数据 · 内部风险判断 · 未审核 AI 草稿 · 客户隐私 · 其它商家任务。
AI 在外包环节做：生成 brief · 生成验收标准 · 生成修改意见 · 对提交成果**初步检查**;**最终验收永远由审核员完成**。

## Chapter 15：Client-Facing AI Boundaries（客户侧边界）

客户**可见**：已审核的内容方案/图片/视频/文案 · 待确认事项 · 待补充问题 · 进度说明。
客户**不可见**：未审核 AI 草稿 · 内部 Prompt · 外包原始讨论 · 内部风险争议 · 其它客户数据。
客户确认页固定说明：**「这是待确认内容 · 可提出修改意见 · 确认后才进入下一步 · 不承诺增长结果」**。

## Chapter 16：Audit / Risk AI（审核 AI 专章）

**运行节点**：提交诊断前 · 提交内容方案前 · 提交图片/视频成果前 · 给客户确认前 · 发布前 · 复盘报告前。
**检查项**：缺证据 · 编造数据 · 承诺增长 · 违反平台规则 · 侵犯版权 · 泄露隐私 · DEMO/UAT 当真实案例 · 把 AI 输出当事实。
**铁律**：**审核 AI 只能提示风险,不能自动批准**——它是 Reviewer 的放大镜,不是替代者（承 AIGO"Auditor 不放行,终审在人"）。

## Chapter 17：Data Models Needed Later（后续数据模型 · 只设计）

| 模型 | 用途 |
|---|---|
| **AIProvider** | 供应商登记（名称/能力/状态,**不存密钥**）|
| **AICapability** | 能力分类（Ch.3 十二类）↔ provider 多对多 |
| **AITaskDefinition** | 任务注册表（Ch.10 字段）|
| **AIDraft / AIDraftVersion** | 草稿 + 版本历史（生命周期 Ch.6）|
| **AIReviewRecord** | 人工审核留痕（谁/结论/原因/第几轮）|
| **AIUsageLog** | 使用记录（任务/能力/provider/耗时,**不记敏感凭据**）|
| **AIContextSnapshot** | 草稿绑定的上下文版本快照 |
| **GeneratedAsset / MediaAsset** | 生成物/媒体素材（图/视频/文件）|
| **PromptTemplate** | Prompt 模板版本化 |
| **ProviderCredentialReference** | 凭据**引用**（指向环境变量/secret manager 的键名）|

> 🔒 强制：**不在数据库明文保存 provider 密钥**;密钥只存安全环境变量/secret manager;AIUsageLog 不记录敏感凭据。

## Chapter 18：Implementation Phases（实现顺序）

| Phase | 内容 |
|---|---|
| **1 扩展现有 AI Workbench** | 更多任务类型 · 任务分类 · 上下文分级 · 保存草稿记录 |
| **2 AI Draft + Review** | AIDraft + AIReviewRecord;审核/退回/重生成 |
| **3 Outsource Brief AI** | 外包任务生成 · 验收标准 · 修改意见 |
| **4 Image / Video AI 接入** | 生图 prompt · 视频脚本/分镜/剪辑 brief · 外部工具输出回填 |
| **5 Provider 管理** | AIProvider/AICapability · 选择与备用 |
| **6 自动 API 调用** | 人工复制 Prompt 模式稳定后再接 API;**API 输出仍需人工审核** |

> 与账户工作流蓝图（TASK-068）的衔接：其 Phase 1-3（角色分流/Task/审核）先行;本蓝图 Phase 1-2 与其 Phase 6 并轨推进。

## Chapter 19：What Not To Build Yet（暂不做）

⛔ 自动 AI 决策 · 自动进入下一步 · 自动发布内容 · 自动投流 · 自动承诺增长 · 自动给客户发未审核内容 · 客户直接调用内部 AI · 外包访问完整经营数据 · 未审核生图/视频直接发布 · AI provider 密钥管理后台 · 大规模多 provider 自动调度。

## Chapter 20：Final Recommendation

**实施序**：① 角色首页分流 → ② Task / Review / Assignment → ③ AI Workbench 扩展为 AI Task Registry → ④ AI Draft + Review → ⑤ 外包任务 + 外包 brief AI → ⑥ 图片/视频/多 provider API。

> **多 AI 是系统最终方向,但不应一开始直接接 API。** 先把"每个环节需要什么 AI、输入输出什么、由谁审核、保存到哪里"设计清楚（本文即此设计）,在人工复制 Prompt 模式上跑稳每类任务,再逐能力 API 化——任何 provider 的输出永远进同一套"草稿→人工审核→人提交下一步"管道。

> 本文为只读设计文档;按 CHANGE_POLICY 属"新增文档（低风险）"。**未改任何代码 / schema / 角色 / 数据,未接任何 AI API。** 本任务成功代表:TOT 明确了多 AI 专职协同体系——知道每个业务阶段用什么 AI、输出如何审核、如何交给人工/外包/客户。
