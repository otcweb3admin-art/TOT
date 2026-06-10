# Account Role Permission & Operational Workflow Blueprint V1（账户分权与运营工作流系统设计）

> 类型：**纯业务 / 产品 / 权限 / 工作流设计文档**　｜　日期：2026-06-11　｜　任务：TASK-068(设计)
> 范围：**只设计、不实现**——不改代码 / schema / migration / role-access,不创建账号/商家,不接 AI API。本文的"工作流"仅为业务流程设计,非代码工作流。
> 上承：[P2 Freeze](./p2-pre-pilot-system-freeze-handoff-summary-v1.md) · [RC Verification](./production-release-candidate-verification-v1.md) · [Account Setup Guide](./internal-role-account-setup-guide-v1.md) · [Role & Handoff Guide](./role-and-handoff-operating-guide-v1.md) · [Outreach Kit](./first-pilot-merchant-outreach-kit-v1.md) · [Prospect Tracker](./first-pilot-merchant-prospect-tracker-v1.md) · [Role-Based UI Architecture](./role-based-ui-and-stage-handoff-architecture-v1.md) · 真实代码（Role enum / role-access / dashboard / ai-workbench / intake）

> ⚠️ 贯穿全文的不变约束：**AI 不拍板、人工审核后才进入下一步、不承诺增长结果、证据纪律（待补充/不编造）、Human Commercial Authority。**

---

## Chapter 1：Executive Summary

**目的**：把 TOT 从"信息录入系统"升级为 **"账户分权 + 任务驱动 + AI 辅助 + 人工审核 + 外包协同"的商家线上代运营工作系统**。

**一句话目标**：用户登录后不是自己找页面,而是系统告诉他——
**你是谁 · 你负责什么 · 当前有哪些任务 · 下一步要做什么 · 做完提交给谁 · 哪些用 AI 辅助 · 哪些需人工审核 · 哪些需客户配合 · 哪些可交外包。**

**核心转变**：

| 现状（信息管理系统）| 目标（角色驱动工作流系统）|
|---|---|
| 所有人看同一个 Dashboard | 按角色分流到各自工作台 |
| 人找页面填表 | 系统按阶段推任务给人 |
| handoff = 交接记录 | submit→review→approve/退回 真审核流 |
| AI 工作台是独立工具 | AI 按钮嵌入每个环节,审核后入库 |
| 无外包概念 | 外包只见自己任务+要求+验收标准 |
| 无客户视图 | 客户只见进度+待配合+待确认 |

---

## Chapter 2：Current Role Gap Analysis（基于真实系统）

当前真实 Role enum（6 个）与差距：

| 角色 | 现状（role-access 实测映射）| 差距 |
|---|---|---|
| `merchant` | 不可写任何内部节点,无任何页面 | 可作客户账户基础,但**客户门户能力为零**（无进度/补资料/确认视图）|
| `collector` | 可写 主体/画像/基线/承接/素材 | 可作采集员,但**缺"采集任务工作台"**（待采集/被退回/已提交队列）|
| `operator` | 可写 诊断/复盘/计划/承接+协调 | **过于宽泛**——既是协调又是审核占位,不能准确表示"人工审核账户" |
| `executor` | 可写 账号/素材/内容/直播/引流 | 可临时表示执行/外包,但**外包权限边界不清**（能看全商家资料,外包不该看）|
| `admin` | 全部 | 可作平台管理,但缺账号管理 UI |
| `ai_worker` | 不可写（只读）| 正确——**不应作为真人账号**,应是 AI 能力标识 / 系统内部能力 |

**结论**：枚举可承载短期,但**账户体系必须按实际业务角色重新设计**（客户/采集/审核/外包/管理）,且外包需要"任务级"而非"商家级"可见性——这是当前权限模型（商家级+节点级）覆盖不了的,需要未来 Task/Assignment 模型（Ch.15）。

---

## Chapter 3：Target Account Types（目标账户类型）

### 3.1 客户账户 Customer / Merchant Portal

**登录后看到**：项目进度条 · 已完成环节 · 当前需客户配合什么 · 需补充哪些资料 · 已提交待客户确认的内容 · 下一步计划。
**不显示**：内部审核细节 · 外包人员信息 · 内部 AI Prompt · 敏感运营判断（如"老板单点风险"原文需转译为温和表述或不展示）。

| 可操作 | 不可操作 |
|---|---|
| 查看进度 / 查看待确认事项 | 改内部诊断 / 运营方案 / 审核结果 |
| 补充资料 / 上传素材 | 看到所有内部任务 |
| 确认信息 / 对成果提出反馈 | 直接触发外包任务 |
| | 直接调用 AI 生成正式结论 |

### 3.2 采集员账户 Collector

**登录后看到**：待采集商家 · 新建商家入口 · Field Pack 采集指引 · 需采集的基础资料 · 待补充清单 · 已采集未提交的草稿 · **被退回修改的采集包**。

| 可操作 | 不可操作 |
|---|---|
| 新建商家 / 填基础信息 / Profile / Baseline / Operating Capacity | 做最终诊断 |
| 记录素材来源 / 标记「待补充」| 批准进入执行 / 承诺增长 |
| 提交「原始采集包」给审核账户 | 分配外包任务 / 改审核通过后的核心结论 |

### 3.3 人工审核账户 Reviewer / Internal Operator（核心工作流账户）

**登录后看到**：全流程商家看板 · 待审核采集包 · 待审核 AI 草稿 · 待审核外包成果 · 待客户确认事项 · 每商家当前阶段/节点状态 · 风险与缺口（五器官）· AI 建议与审核入口。

| 可操作 | 不可操作 |
|---|---|
| 查看完整商家资料 / 审核采集包 / 退回补充 | 绕过证据纪律 |
| 用 AI 生成诊断/方案/文案/素材要求/视频要求草稿并修改 | 把 AI 输出直接当最终结论 |
| 审核通过后提交下一步 / 标记节点完成 | 无基线承诺增长 |
| 创建外包任务 + 设验收标准 / 审核外包成果 | 未审核外包成果就交客户 |
| 提交客户确认 | 修改平台管理员权限 |

### 3.4 外包账户 Outsource / Contractor

**只看到分配给自己的任务**：任务名称 · 商家**必要**信息（非完整资料）· 工作类型（图片设计/视频剪辑/文案制作/素材整理/字幕处理/海报设计/短视频脚本初稿）· 任务要求 · 素材链接或说明 · AI 生成的参考方向 · 验收标准 · 截止时间 · 提交入口 · 退回修改意见。

| 可操作 | 不可操作 |
|---|---|
| 查看自己的任务 / 查看素材说明 | 查看完整客户资料 / 客户经营数据 |
| 提交成果 / 补充说明 | 查看其它外包任务 / 内部审核结论 |
| 按退回意见重新提交 | 直接联系客户（除非授权）/ 改诊断/方案/审核状态 |

### 3.5 平台管理账号 Admin

**看到**：所有商家/账户/角色/任务/交接/审核记录 · 系统状态 · DEMO/UAT/真实数据边界 · 审计记录。
**可操作**：创建管理账号 · 分配角色 · 全局进度 · 权限问题 · 分配负责人 · 系统配置 · 异常数据。
**原则**：Admin 管理系统、**不日常录入**;**不多人共享**;不替代审核角色。

---

## Chapter 4：Recommended Role Model（角色模型建议）

### 方案 A：复用当前 Role enum（短期,推荐先行）

| 现枚举 | 工作流身份 |
|---|---|
| `merchant` | 客户账户（门户视图）|
| `collector` | 采集员 |
| `operator` | **人工审核账户**（Reviewer）|
| `executor` | 外包 / 执行账户 |
| `admin` | 平台管理 |
| `ai_worker` | 不开放真人登录（AI 能力标识）|

优点：零迁移、不改 schema、现有 role-access 写保护直接复用、可立即做"角色首页分流"。
缺点：`executor` 语义不显式（执行≠外包）;`operator` 太宽（协调+审核混一）;缺 reviewer/outsource 明确角色;**外包"任务级可见性"靠 UI 收敛+未来 Task 模型补,枚举本身不解决**。

### 方案 B：新增更清晰角色（中期重构方向）

目标枚举：`customer · collector · reviewer · outsource · admin · ai_assistant(system_ai)`。
迁移：需一次 migration（enum 扩展 + 存量 UserProfile 角色映射:merchant→customer、operator→reviewer、executor→outsource/保留 executor 双轨过渡）;role-access 映射表同步改名。迁移成本低（单表单字段）,但应等**真实多人协同跑过方案 A**、语义确认后再做。

> **推荐**：**先方案 A 快速落地工作流 UI（Phase 1-5）,方案 B 作为中期重构**（在外包真实进场、客户门户上线前执行,避免语义债扩大）。

---

## Chapter 5：Core Workflow Stages（核心业务流转 16 阶段）

| # | 阶段 | 负责人 | 输入 | 输出 | AI | 提交给 | 可退回给 | 状态变化 |
|---|---|---|---|---|---|---|---|---|
| 1 | 候选商家接触 | 商务/负责人(线下) | Outreach Kit/候选表 | 意向商家 | 否 | 负责人立项 | — | （线下）|
| 2 | 客户账户创建/立项 | admin | 负责人授权 | Merchant+customer 账号 | 否 | collector | — | not_started→in_progress |
| 3 | 采集原始资料 | collector | Field Pack | 主体/画像/基线/承接 | 完整性检查 | — | — | in_progress/draft |
| 4 | 提交原始采集包 | collector | 采集草稿 | 采集包 | 否 | reviewer | — | draft→submitted |
| 5 | 审核采集资料 | reviewer | 采集包 | 通过/退回意见 | 缺口提醒 | →6 或退回 | collector | submitted→approved/changes_requested |
| 6 | AI 辅助初步诊断 | reviewer | 已审资料 | 诊断草稿 | **是** | 自审 | 重生成 | draft |
| 7 | 人工审核诊断 | reviewer | AI 草稿 | TB-001 定稿 | 否 | →8 | 重生成/补采集 | draft→approved |
| 8 | 生成运营方向 | reviewer | 诊断 | 内容/账号/引流方向 | **是** | 自审→9 | 重生成 | draft→approved |
| 9 | 拆分执行任务 | reviewer | 运营方向 | 外包任务+验收标准 | brief 草稿 | outsource | — | approved→assigned_to_outsource |
| 10 | 外包执行 | outsource | 任务 brief+素材 | 图/视频/文案/素材 | 参考方向 | — | — | in_progress |
| 11 | 外包提交成果 | outsource | 成果 | 提交物 | 否 | reviewer | — | →outsource_submitted |
| 12 | 审核外包成果 | reviewer | 提交物 vs 验收标准 | 通过/退回 | 否 | →13 或退回 | outsource | →approved/changes_requested |
| 13 | 客户确认 | customer | 已审成果/方案 | 确认/反馈 | 确认文案草稿(reviewer 审) | reviewer | reviewer(反馈) | →client_review→approved |
| 14 | 发布/执行准备 | reviewer(+executor) | 已确认成果 | 上线物料 | 否 | — | — | →completed(节点) |
| 15 | 数据观察 | reviewer | 真实数据 | 观察记录 | 数据摘要 | — | — | in_progress |
| 16 | 复盘与下一步 | reviewer | 基线+真实结果 | TB-007/008 | 复盘草稿 | 负责人确认 | 补数据 | draft→approved→下一轮 |

> 每一处"AI=是"均为**草稿辅助**,人工审核通过才流转;阶段 13/16 的对外动作（确认/下一轮投入）始终由人决定。

---

## Chapter 6：Task Status Model（任务状态模型 · 后续开发依据）

| 状态 | 含义 | 谁可触发 |
|---|---|---|
| `not_started` | 未开始 | 系统创建任务时默认 |
| `in_progress` | 进行中 | 任务负责人（认领/开始）|
| `draft` | 草稿 | 填写人保存 |
| `submitted` | 待审核 | collector/outsource/reviewer 提交 |
| `changes_requested` | 退回修改 | **reviewer**（写明原因+待补项）|
| `approved` | 审核通过 | **reviewer**（admin 兜底）|
| `assigned_to_outsource` | 已分配外包 | reviewer |
| `outsource_submitted` | 外包已提交 | outsource |
| `client_review` | 待客户确认 | reviewer 发起 |
| `completed` | 已完成 | reviewer（客户确认后/节点收口）|
| `cancelled` | 已取消 | 提交人或 reviewer/admin |
| `archived` | 已归档 | reviewer/admin |

规则：**approve/退回只属于 reviewer（admin 兜底）**;customer 只能触发 confirm/反馈;outsource 只能在自己任务上 in_progress/submit;**任何状态流转都不由 AI 触发**。现有节点状态（draft/completed/archived）保留为"资产状态",任务状态是叠加的工作流层,不混用。

---

## Chapter 7：Customer Account Workspace（客户首页设计）

```
[项目进度条 ████████░░ 当前阶段：内容制作中]
┌ 已完成 ───────────────┐ ┌ 需要您配合 ────────────┐
│ ✓ 资料采集            │ │ ☐ 补充：菜单价目表照片  │
│ ✓ 经营诊断            │ │ ☐ 确认：账号定位文案    │
│ ✓ 运营方向确认        │ └───────────────────────┘
└──────────────────────┘
[待您确认的内容]  账号简介文案 ×1 · 首批海报 ×3 → [查看并确认/反馈]
[下一步] 本周完成首批短视频脚本,预计 X 日给您确认
[联系负责人]  ｜ 提示：试点阶段为共同验证,不承诺具体增长数字
```

文案原则：不出现 TB-001/五器官/MGOS 等内部术语;客户只看到**"我们正在做什么 / 我需要提供什么 / 下一步什么时候 / 哪些要我确认"**;每页保留"不承诺增长"提示。

## Chapter 8：Collector Workspace（采集员首页设计）

队列式首页：**我的待采集商家 · 新建商家 · 继续采集（草稿）· 待补充资料 · 已提交待审核 · 被退回修改（含原因）** + Field Pack 指引入口 + 每商家「提交给审核」按钮。
工作流：新建商家→基础资料→Profile→Baseline→Operating Capacity→标证据来源→**提交审核**（=一条 submitted 采集包任务）。复用现有 intake 向导步骤,叠加"提交/退回"状态。

## Chapter 9：Reviewer Workspace（审核员首页设计）

四个待办队列 + 看板：**待审核采集包 · 待审核 AI 草稿 · 待审核外包成果 · 待客户确认跟进**;商家看板（每商家当前阶段/风险[五器官 attention]/缺口）;每条待办带 **[通过] [退回修改] [提交下一步]** 三按钮;AI 任务列表（Ch.13 按钮集）。
工作流：查采集提交→查证据完整性（缺口/可信度）→退回或通过→AI 生成诊断草稿→人工修改→审核通过→创建外包任务（含验收标准）或进入下一节点。

## Chapter 10：Outsource Workspace（外包首页设计）

任务队列：**待开始 · 进行中 · 已提交待审核 · 被退回修改 · 已完成**。
任务详情页：商家必要背景（脱敏,只给做活需要的）· 工作类型 · 工作目标 · AI 参考方向 · 素材说明/链接 · 格式要求 · 截止时间 · **验收标准** · 提交成果入口 · 修改意见区。
边界（硬性）：看不到商家列表/经营数据/其它人任务/内部结论;提交后只等审核结果。

## Chapter 11：Admin Workspace（管理员首页设计）

全局视图：全部商家/账户/任务/交接 + 当前异常（卡住超时的 submitted、无负责人商家）+ 权限管理（建号/分配角色/停用）+ DEMO/UAT/真实数据边界统计 + 系统状态（smoke/部署）+ 审计记录。
原则：管理系统不日常录入 · 不共享 · 不替代 reviewer 审核。

---

## Chapter 12：AI Integration Points（AI 介入点）

| 环节 | AI 可做 |
|---|---|
| **采集完成后** | 资料完整性检查 · 缺失信息提醒 · 初步诊断草稿 |
| **诊断阶段** | 商家诊断草稿 · 五器官观察 · 风险提示 · 下一步建议 |
| **内容策划** | 内容方向 · 短视频主题 · 图文主题 · 标题文案 · 发布节奏建议 |
| **图片制作** | 图片风格参考 · 海报文案 · 设计 brief · 外包任务说明 |
| **视频制作** | 视频脚本 · 分镜建议 · 剪辑要求 · 字幕文案 · 口播稿 |
| **文案** | 社媒文案 · 活动文案 · 私域跟进话术 · 客户咨询回复模板 |
| **外包任务生成** | 外包 brief · 验收标准草稿 · 素材清单 · 注意事项 |
| **复盘** | 数据摘要 · 问题归因草稿 · 下阶段建议 |

**每个 AI 输出必须**：人工审核 · 可退回重生成 · 可修改 · **不自动进入下一步** · 不承诺增长结果。（现有 ai-workbench 的 7 类任务/上下文/安全规则即为此处的基础设施,扩展即可。）

## Chapter 13：AI Button Design（AI 按钮设计）

按钮集（嵌入对应板块,而非只在独立 AI 页）：**生成诊断草稿 · 检查资料缺口 · 生成内容方向 · 生成图片制作 Brief · 生成视频剪辑要求 · 生成外包任务说明 · 生成验收标准 · 生成客户确认文案 · 生成复盘草稿**。

统一点击流程（8 步）：
1. 系统读取当前商家/任务上下文（复用 `buildAiMerchantContext`,扩展任务上下文）
2. 生成 Prompt（含安全规则 + DEMO/UAT 标记）
3. **当前阶段：复制给 AI（人工）;后续阶段：接 API 调用**
4. AI 返回草稿
5. **人工审核**（删编造/标待验证/补来源）
6. 通过 → 保存到对应节点/任务（仍受 role-access）
7. 不通过 → 修改 Prompt / 重新生成
8. 保存后由人提交进入下一步

> 与现有实现的关系：步骤 1/2/4/5 已在 ai-workbench V0 落地;新增的是**按钮下沉到各板块 + 步骤 6 的"审核后直存"+（后续）步骤 3 的 API 化**。

## Chapter 14：Handoff / Review / Approval Model（审核交接模型）

动作语义（区分,勿混用）：

`submit 提交` → `review 审核` → `approve 通过` / `reject·changes_requested 退回修改` ‖ `assign 分配外包` → `submit_result 外包提交` → (review) → `client_confirm 客户确认` → `complete 完成`

**现状澄清**：当前 `MerchantStageHandoff`（submitted/received/cancelled）只是**交接记录**——received ≠ approved,**不等于审批**。
**后续应新增** Review / Task / Assignment 概念（Ch.15）承载真审核流;handoff 保留为"节点间移交留痕",与 Task 状态机并存（或被 Task 吸收,实现时定）。

## Chapter 15：Required Future Data Models（后续数据模型 · 只设计）

| 模型 | 用途 |
|---|---|
| **WorkItem / Task** | 工作流核心:类型(采集包/诊断/内容/外包/确认)、商家、负责人、状态(Ch.6)、截止时间 |
| **ReviewRecord** | 每轮审核留痕:谁审/结论(通过/退回)/原因/待补项/第几轮 |
| **Assignment** | 外包分配:任务↔外包账号、brief、验收标准、酬劳说明(暂不结算) |
| **OutsourceSubmission** | 外包提交物:文件/链接/说明/版本 |
| **ClientRequest** | 需客户配合事项:补资料/上传素材,状态+截止 |
| **ClientConfirmation** | 客户确认记录:内容快照、确认/反馈、时间 |
| **AIDraft** | AI 草稿留痕:任务类型、Prompt 摘要、输出、是否被采用 |
| **AIReview** | 对 AI 草稿的人工审核记录(采用/修改/弃用+原因) |
| **Attachment / File** | 素材与成果文件(当前无上传,需对象存储) |
| **Comment / Feedback** | 任务/节点上的沟通线 |
| **Notification** | 站内通知:被分配/被退回/待确认 |

设计原则：全部带 createdBy/updatedBy 审计 FK(沿用 UserProfile.id 风格);客户/外包可见性在**模型层**收敛(Task 级),不靠 UI 隐藏。

## Chapter 16：Page / Route Design（页面路由设计）

| 角色 | 路由 |
|---|---|
| Customer | `/dashboard/customer` · `/customer/tasks` · `/customer/confirmations` · `/customer/materials` |
| Collector | `/dashboard/collector` · `/collector/intake` · `/collector/submissions` |
| Reviewer | `/dashboard/reviewer` · `/reviewer/reviews` · `/reviewer/ai-drafts` · `/reviewer/outsource-review` |
| Outsource | `/dashboard/outsource` · `/outsource/tasks` · `/outsource/tasks/[id]` |
| Admin | `/dashboard/admin` · `/admin/users` · `/admin/roles` · `/admin/tasks` · `/admin/audit` |

**与现有结构的连接**：`/dashboard` 改为**按 role 分流**（Phase 1:redirect 或条件渲染到各角色首页）;现有 `merchants/*`、`ai-workbench`、`handoffs`、`intake`、`launch-readiness` 成为 collector/reviewer 工作台的下层页面（保留 URL 不破坏）;merchant/outsource 登录后**不再看到现有内部 dashboard**,只见各自门户。

## Chapter 17：MVP Implementation Phases（实现顺序建议）

| Phase | 内容 | 备注 |
|---|---|---|
| **1 角色首页分流** | 登录按 role 进 客户/采集/审核/外包/管理 五个首页（先静态队列,复用现有数据）| 不动 DB,最快见效 |
| **2 任务中心** | 新增统一 Task/WorkItem 模型,工作真正流动 | 首个新 migration |
| **3 审核与退回** | submitted/approved/changes_requested + ReviewRecord | 真审核流 |
| **4 外包任务** | Assignment+OutsourceSubmission:分配/提交/验收 | 含任务级可见性 |
| **5 客户门户** | 进度/补资料/确认（ClientRequest/Confirmation,需文件上传）| merchant 角色启用 |
| **6 AI 深度集成** | 各节点 AI 按钮+审核后直存,(可选)接 API | AIDraft/AIReview 落库 |

## Chapter 18：What Not To Build Yet（暂不做）

⛔ 自动 AI 决策 · 自动承诺增长 · MVS · Experience Base · 自动投流 · 自动结算外包费用 · 客户直接编辑内部诊断 · 外包查看完整客户经营数据 · 多租户复杂组织架构（除非真实需要）。

## Chapter 19：Final Recommendation

- **下一步不应继续做 UAT 数据或泛泛 UI 打磨**——沙盒与 RC 验收已就绪,边际收益递减。
- 应先完成本设计所定的**"账户分权 + 任务流转 + 审核机制 + 外包协同 + AI 按钮"总设计 → 再进入代码实现**（本文即该总设计）。
- **最先实现（推荐顺序）**：① 角色首页分流 ② 采集员工作台 ③ 审核员工作台 ④ 客户进度页 ⑤ 外包任务页 ⑥ 统一 Task 模型。
- 角色枚举：**短期方案 A 复用现有 6 枚举;中期方案 B 引入 customer/reviewer/outsource**（外包真实进场前完成迁移）。
- 不变约束持续生效：AI 只产草稿、审核在人、对外承诺与商业决策永远是人（Human Commercial Authority）。

> 本文为只读设计文档;按 CHANGE_POLICY 属"新增文档（低风险）"。**未改任何代码 / schema / 角色 / 数据**。本任务成功代表:TOT 明确了从"信息系统"升级为"角色分权 + 任务流转 + AI 辅助 + 人工审核 + 外包协同"线上代运营工作系统的完整蓝图。
