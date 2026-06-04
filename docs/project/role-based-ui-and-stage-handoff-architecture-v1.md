# Role-Based UI & Stage Handoff Architecture V1（角色分权界面与环节交接体系）

> 类型：**只读业务 / 产品 / 权限架构分析**　｜　日期：2026-06-04　｜　任务：TASK-054
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不实现页面 / 不改现有权限逻辑 / 无复杂 Workflow·AI·MVS**。本文只输出文档。
> 本文回答：**不同账户看到什么 / 能做什么 / 不能做什么 · 一个节点做完后如何交给下一个环节 · 工作台 UI 如何统一显示责任/状态/证据/下一步。**
> 上承：[PROJECT_STATE](./PROJECT_STATE.md) · [p2-chain-review](./p2-chain-review-and-refactor-check-v1.md) · [commercial-operating](./commercial-operating-architecture-v1.md) · [AIGO](./ai-growth-organization-architecture-v1.md) · [MGOS](./merchant-growth-operating-system-architecture-v1.md) · [Intake Playbook](./pilot-merchant-intake-playbook-v1.md) · [Readiness Gate](./pilot-readiness-gate-v1.md) · [Field Pack](./pilot-intake-field-pack-v1.md) · [Evidence Framework](./evidence-framework-specification-v1.md) · `docs/architecture/ROLE_MODEL.md`

---

## ⚠️ 两条贯穿全文的最高约束

1. **Human Commercial Authority**：交接、审核、放行**最终都由人确认**。系统可提示"可提交"，AI 可整理依据，但**是否进入下一环节由人决定**。
2. **本文只设计、不实现**：所有"扩展状态 / Handoff 记录 / 节点级权限"均为**架构建议**，当前代码未实现，不在本任务落地。

---

## 1. Executive Summary（结论摘要）

TOT 当前是**单人可用系统**（一个 operator 账号即可跑通全链）。要升级为**多人协同运营系统**，需要回答"谁看到什么、谁能改什么、做完怎么交接"。

- **当前真实状态**（已读 schema/代码确认）：Role enum 有 **6 个角色**（`merchant/collector/operator/executor/admin/ai_worker`）；但**角色尚未真正接入 UI/权限**——所有 JIT 建档用户默认 `operator`，权限**只有商家级**（`admin` 全见 / 其它仅自有），**没有节点级权限**；节点 status 只有 `draft/completed/archived`，**不足以表达"提交/待审/打回/锁定"**；**没有 Handoff / Review 记录**。
- **核心建议**：分四阶段渐进（**A 统一 UI 显示 → B 角色视图 → C 轻量 Handoff 模型 → D 审核/放行**），**先做 UI + 手动状态，不做自动流转**，避免提前引入复杂 Workflow（守 CODE.md 不提前平台化）。
- **角色体系**：以现有 6 枚举为底座，映射 8 类业务角色；**明确指出枚举粗粒度、若干业务角色无对应枚举**（Commercial/PM/Analyst/Planner/Reviewer/Viewer 当前塌缩到 operator/executor/collector 或缺位）——这是要先想清、但**不急于炸开枚举**的设计点。

---

## 2. Why Role-Based UI Is Needed（为什么需要角色分权界面）

单人系统里"一个人看全部、改全部"没问题；多人协同时会出现：

- **越权**：采集员下了最终诊断、商务改了引流方案、有人替商业负责人拍板。
- **责任不清**：一个节点谁填的、谁审的、卡在谁手里，看不出来。
- **交接断裂**：上游做完了，下游不知道能开始；下游开始了，看不到上游依据。
- **证据漂移**：没有"证据是否充分"的统一显示，低可信数据被当事实用。

> 角色分权 UI + 环节交接，本质是把 [AIGO 的"生产与审计分离、多角色交叉校验"](./ai-growth-organization-architecture-v1.md) 和 [MGOS 的"人机责任边界"](./merchant-growth-operating-system-architecture-v1.md) **落到人类协同界面上**。

---

## 3. Current State Review（当前状态盘点 · 已读代码确认）

| 维度 | 现状 | 缺口 |
|---|---|---|
| **Role enum** | 6 个：`merchant/collector/operator/executor/admin/ai_worker`（见 ROLE_MODEL）| 业务角色（商务/PM/分析/方案/审核/Viewer）无 1:1 枚举 |
| **角色接入** | 全部 JIT 用户默认 `operator`；角色未驱动任何 UI/权限 | 角色形同虚设 |
| **权限粒度** | **仅商家级**：`admin` 全见全写 / 其它仅 owner\|createdBy（`permissions.ts`）| **无节点级**编辑/审核权限 |
| **节点状态** | 各 TB `*Status` = `draft/completed/archived` | 无 `submitted/needs_revision/approved/locked` |
| **交接** | 无 Handoff 记录；上下游靠 `source*Id` 软引用 | 无"交接人/接收角色/缺口/确认" |
| **审核** | 无 Review 记录；无打回机制 | 无 |
| **责任显示** | 节点有 createdBy/updatedBy（UI 显示更新人）| 无"负责人/当前阶段/阻塞点"统一显示 |
| **证据状态** | 有 Baseline `dataConfidence`；有 UI 护栏文案 | 无统一"证据状态"标识 |

> **第 7 个角色 `outsource`**（SYSTEM_BLUEPRINT 提及）当前未入枚举，属已知差异，**待用户定夺**，本文不擅自增删。

---

## 4. Role Taxonomy（角色体系 · 业务角色 → 真实枚举映射）

> **8 类业务角色**（运营所需）映射到**现有 6 枚举**。`→` 后是建议承载的枚举；⚠ 标记"枚举缺位/需细分"。

| # | 业务角色 | 职责（精简）| 不能 | → 现有枚举 |
|---|---|---|---|---|
| 1 | **Admin / Owner** | 全局查看·账号管理·商家分配·最终商业决策·高风险确认 | 让 AI 替代商业判断 | `admin` |
| 2 | **Project Manager 项目负责人** | 看负责商家全链·判断可否进下一环节·是否补资料·协调人员 | 编造数据·跳证据门 | ⚠ `operator`（审核位）/ 现塌缩到 `admin` |
| 3 | **Commercial 商务** | 接触商家·记意向·收基础资料·创建 Merchant·标接入前确认 | 编辑 TB-004/006/007/008 | ⚠ 无对应枚举（现塌缩到 `collector`/`admin`）|
| 4 | **Intake 采集录入** | 填 Profile/Baseline/OperatingCapacity·标证据来源与缺口·提交给诊断 | 下诊断·决定放量·低可信写成高可信 | `collector`（前端采集员）|
| 5 | **Growth Analyst 诊断** | 看 Profile/Baseline/Capacity·填 TB-001·标问题/机会/风险·交方案 | 无证据写确定结论·决定签约/收费 | ⚠ 现塌缩到 `operator`/`executor`（人）；AI 侧 = `ai_worker`·Analyst |
| 6 | **Planner 方案** | 填 TB-002~006·基于上游做方案·标归因与风险·交 PM 审核 | 直接投流·进 MVS·无上游凭空写 | `executor`（执行人员）；AI 侧 = `ai_worker`·Planner |
| 7 | **Reviewer / Auditor 审核** | 查证据充分性/越界/缺口·打回或建议通过 | 自审自·替商业负责人最终决策 | ⚠ `operator`（内部-审核位）；AI 侧 = `ai_worker`·Auditor |
| 8 | **Viewer / Training / Demo** | 看 DEMO·学流程·只读 | 改真实商家·提交节点·操作真实数据 | ⚠ 无对应枚举（建议未来加只读视图/role）|

> **AI 角色不在此 8 类的"人"里**：[AIGO 的 ai_worker 四职能](./ai-growth-organization-architecture-v1.md)（Researcher / Analyst / Planner / Auditor）只**生产草稿（`ai_generated`）+ 审计**，**永不拍板**；本文的"人类角色"始终在 AI 之上做确认。

---

## 5. Account Visibility Matrix（账户可见性矩阵）

> 状态：现有可落地（merchant 级）/ 建议（节点级，待 Phase B/C）。

| Role | 可见商家 | 可见模块 | 可编辑模块 | 可提交节点 | 可审核节点 | 禁止动作 | 典型入口 |
|---|---|---|---|---|---|---|---|
| **Admin** | 全部 | 全部 | 全部（含账号/分配）| 全部 | 全部 | AI 替代商业判断 | `/dashboard/merchants`（全量）|
| **Project Manager** | 负责的商家 | 全链 + 交接/审核状态 | 不直接编内容；可改状态/分配 | — | 全部节点（放行确认）| 编数据·跳证据门 | Workspace（看全链 + 阻塞点）|
| **Commercial** | 自己接触的商家 | Merchant + Profile(部分) + Playbook/Field Pack 提示 | Merchant 基础信息 | Merchant→Intake | — | 编 TB-004/006/007/008 | `/merchants/new`、详情 |
| **Intake Operator** | 分配/自建的商家 | Profile/Baseline/OperatingCapacity + 上游 | Profile/Baseline/OperatingCapacity | 这三项 → Diagnosis | — | 下诊断·决定放量 | `/[id]/profile`·`/baseline`·`/operating-capacity` |
| **Growth Analyst** | 分配的商家 | Profile/Baseline/Capacity（只读）+ TB-001 | TB-001 Diagnosis | TB-001 → 方案 | — | 无证据写结论·签约/收费 | `/[id]/diagnosis` |
| **Planner** | 分配的商家 | 诊断（只读）+ TB-002~006 | TB-002~006 | TB-002~006 → PM 审核 | — | 投流·进 MVS·无上游凭空写 | `/[id]/account-setup`…`/lead-conversion` |
| **Reviewer** | 分配的商家 | 全链 + 证据状态 | 不编内容；写审核意见/打回 | — | 全部节点（建议通过/打回）| 自审自·最终商业决策 | Workspace（审核视图）|
| **Viewer / Demo** | **仅 DEMO_** | 只读全链 | **无** | 无 | 无 | 改真实/提交/操作真实数据 | DEMO Workspace（只读）|

> ⚠ **当前代码只能实现"全部 vs 自有"两档**（admin/others，merchant 级）。上表的细分是 **Phase B/C 目标**；落地前可先用"角色 → UI 显示差异 + 写操作保护"近似（见路线图）。

---

## 6. Node Operation Matrix（节点操作矩阵）

> 上游输入沿用现有 `source*Id` 软引用链。"主要编辑/审核/下游接收"为**建议角色**。

| 节点 | 上游输入 | 主要编辑角色 | 审核角色 | 下游接收 | 可提交条件 | 不可提交条件 | 需展示提示 |
|---|---|---|---|---|---|---|---|
| **Merchant** | —（接入前确认）| Commercial | PM | Intake | 基础信息齐 + 接入前确认 | 无合作意向/无授权 | 主体≠诊断，别塞备注 |
| **Profile** | — | Intake | Analyst/PM | Baseline | Offer/客群有事实 | 全空/编造 | 先事实后判断·Offer 3 秒懂 |
| **Baseline** | — | Intake | Analyst/PM | OperatingCapacity | 有数或标缺 + 标可信度 | 低可信写成 high | 老板估计≠high |
| **Operating Capacity** | — | Intake | PM | Diagnosis | 履约/组织有记录或标缺 | 编造承接能力 | 决定能否放量 |
| **TB-001 Diagnosis** | Profile+Baseline+Capacity | Growth Analyst | Reviewer/PM | TB-002/003/004 | 根因有证据或标待验证 | 无证据写确定结论 | 非建议合集·非 AI 结论 |
| **TB-002 Account Setup** | TB-001 | Planner | Reviewer | TB-003 | 有上游引用 | 无上游凭空写 | 看上游再填 |
| **TB-003 Material** | TB-002 | Planner/Intake | Reviewer | TB-004 | 同上 | 同上 | 缺素材标缺口 |
| **TB-004 Content** | TB-003 | Planner | Reviewer/PM | TB-005/006 | 同上 | 同上 | 禁区/频率如实 |
| **TB-005 Live Planning** | TB-004 | Planner | Reviewer | TB-006 | 同上 | 同上 | 准备度如实 |
| **TB-006 Lead Conversion** | TB-004+TB-005 | Planner | Reviewer/PM | TB-007 | **有归因方式** | 无归因即放量 | 无归因不投流 |
| **TB-007 Data Review** | Baseline+TB-004/005/006 | Analyst | Reviewer/PM | TB-008 | **有真实结果** | 无真实结果强行 completed | 仅经验候选·非真实即 draft |
| **TB-008 Growth Plan** | Baseline+TB-001+006+007 | Planner/PM | PM | 下一轮/执行准备 | 有复盘依据 | 无依据造计划 | 无依据只 draft |
| **Workspace** | —（聚合）| —（只读视图）| —（PM/Reviewer 看）| — | —（只读）| — | 提示非系统决策·当前 Conditional Go |

---

## 7. Unified UI Display Model（统一 UI 显示模型）

### 7.1 Workspace 顶部（统一信息条）
应显示：**商家名称 · 商家状态 · 是否 DEMO · 当前负责人 · 当前所在阶段 · 当前阻塞点（第一个 missing/needs_revision）· 下一步建议（规则）· "不代表系统决策"提示**。
> 现状：已有名称/状态/DEMO 提示/下一步规则/链路完整度；**待补**：负责人、当前阶段、阻塞点（Phase A）。

### 7.2 节点卡片统一结构
每个节点卡片统一显示：**节点名称 · 节点编号 · 当前状态 · 负责人 · 最后更新人 · 最后更新时间 · 证据状态 · 上游引用 · 当前操作入口 · 下一步动作 · 提交/退回/编辑入口**。
> 现状：已有名称/状态徽章/更新人/更新时间/上游引用/编辑入口；**待补**：负责人、证据状态、提交/退回入口（Phase A/C）。

### 7.3 状态统一（现有 + 建议扩展 · 本文只设计）

| 状态 | 含义 | 现状 |
|---|---|---|
| `missing` | 未创建 | ✅ 现有（工作台派生）|
| `draft` | 草稿 | ✅ 现有 |
| `completed` | 已完成 | ✅ 现有 |
| `archived` | 归档 | ✅ 现有 |
| `submitted` | 已提交待确认 | 🔵 建议（Phase C）|
| `needs_revision` | 需修改（被打回）| 🔵 建议 |
| `approved` | 已确认可进下一环节 | 🔵 建议 |
| `locked` | 已锁定不可随意改 | 🔵 建议 |

> ⚠ 扩展状态**不在本任务实现**；落地需新 migration（未来），且应**人工流转**而非自动。

### 7.4 证据状态统一（与 [Evidence Framework E0–E3](./evidence-framework-specification-v1.md) 对应）

| 证据状态 | 含义 | 对应 E 级 |
|---|---|---|
| `evidence_missing` | 关键事实缺失 | 仅 E0 / 空 |
| `evidence_weak` | 单一低可信（口述/单源）| 低可信 E1 / 单源 E2 |
| `evidence_partial` | 部分有据、关键有缺 | 混合 |
| `evidence_sufficient` | 关键结论过"证据问责五问" | E1/E2/E3 充分 |
| `evidence_conflict` | 多源矛盾 | 冲突 |

> 证据状态是**给人看的判断辅助**，不自动放行（呼应证据宪法"可信度辅助人工、不自动开关"）。

---

## 8. Stage Handoff Model（环节交接模型）

### 8.1 交接链（沿用现有软引用方向）
```
Profile / Baseline / OperatingCapacity ──► TB-001 Diagnosis
TB-001 ──► TB-002 Account Setup / TB-003 Material / TB-004 Content
TB-004 / TB-005 ──► TB-006 Lead Conversion
TB-006 ──► TB-007 Data Review
TB-007 ──► TB-008 Growth Plan
TB-008 ──► 下一轮 / 执行准备
```

### 8.2 每次交接必须包含
**交接节点 · 交接人 · 接收角色 · 交接摘要 · 上游依据 · 缺口说明 · 风险说明 · 是否允许进入下一环节 · 人工确认记录**。

### 8.3 交接不是自动审批（铁律）
> 系统可提示"可提交"；AI 可整理依据；**但是否进入下一环节由人确认**。交接是"人把责任交给下一个人"，不是"系统自动流转"。

### 8.4 与 AIGO 的关系
AI（ai_worker）在交接里只做**整理依据 + 审计提示**（Evidence/Risk Auditor），生产-审计分离；**确认与放行永远是人**。

---

## 9. Review / Revision Model（审核 / 打回模型）

| 项 | 设计 |
|---|---|
| **何时打回** | 证据不足 / 越界（角色不该填的）/ 关键缺口未标 / 无上游凭空写 / 低可信当事实 |
| **打回给谁** | 退回该节点**主要编辑角色**（如 TB-001 退回 Analyst）|
| **打回原因** | 必填（结构化：缺什么证据 / 哪条越界 / 哪个缺口）|
| **需要补什么** | 列出待补项（对应 `evidence_missing` / 字段）|
| **再提交记录** | 保留每轮 submit→review 历史（谁提、谁审、第几轮、结论）|

> 审核铁律：**不自审自**（出方案的不审自己，承 AIGO 生产-审计分离）；**审核员不替商业负责人做最终决策**（放行是 PM/Admin 的商业判断）。

---

## 10. Human Decision Boundary（人类决策边界）

**必须由人确认**（系统/AI 只提供依据）：

| 决策 | 归属角色 |
|---|---|
| 是否签约 / 收费 / 投入资源 | Admin / Commercial+Admin |
| 是否进入试点 / 暂停 | Project Manager |
| 节点是否放行进下一环节 | Reviewer 建议 + PM 确认 |
| 是否放大流量 / 投流 | Project Manager（参考承接 + 归因）|
| 是否进入 MVS / 下一轮 | Project Manager |

> 两条不可移动边界（承 MGOS）：**① AI 不拍板　② 无证据不放行**。角色分权 UI 的作用是把这两条**显性化到每个人的界面与每次交接**。

---

## 11. Risk Review（风险与边界）

1. **当前只有商家级权限，无节点级**——细粒度权限是 Phase B/C，落地前别假装已有。
2. **节点状态不足表达提交/审核/打回**——需扩展状态（未来 migration），本文只设计。
3. **无 Handoff / Review 记录**——交接/审核暂只能靠人 + UI 显示，不能假装有审计链。
4. **不能为做交接就引入复杂 Workflow**——守 CODE.md 不提前平台化；先 UI + 手动状态。
5. **第一阶段先做"显示 + 手动状态"，不自动流转**——避免错误自动化放大风险。
6. **Human Commercial Authority 必须保留**——任何阶段都不让系统/AI 替人拍板。
7. **角色枚举粗粒度风险**：硬塞业务角色进 6 枚举会失真；建议先用"角色→UI 视图 + 写保护"，**枚举扩展是慎重的业务决策**（含 `outsource` 第 7 角色，待用户定）。

---

## 12. Implementation Roadmap（分阶段落地建议 · 本文不实现）

| 阶段 | 内容 | 是否动 DB | 风险 |
|---|---|---|---|
| **Phase A · UI 统一** | 统一节点卡片（名称/编号/状态/负责人/更新人/上游/下一步）+ 统一状态文案 + 工作台顶部信息条（负责人/阶段/阻塞点）| **否** | 低 |
| **Phase B · 角色视图** | 按 `role` 控制 UI 显示 + **保护写操作**（不该编的角色隐藏/禁用入口）；不强求立即 DB 级节点权限 | 否（读 role）| 低-中 |
| **Phase C · Handoff 轻量模型** | 新增 `MerchantStageHandoff`（见下），**手动**提交/接收/确认，仍不自动流转 | **是（新 migration）** | 中 |
| **Phase D · Review / Approval** | 审核记录 + 打回 + 扩展状态（submitted/needs_revision/approved/locked）| 是 | 中-高（后做）|

> 建议**先 A 再 B**（不动 DB、立刻提升多人可用性），**C/D 待真实试点验证后**再上，且每步守"人工确认、不自动流转"。

### 12.1 Phase C 建议模型（仅字段建议，本文不建表）
`MerchantStageHandoff`：`id · merchantId · fromNode · toNode · status · submittedBy · receivedBy · reviewedBy · summary · gapSummary · riskSummary · createdAt · reviewedAt`（均参考现有审计 FK 风格 → `UserProfile.id`；1 商家多条；与现有 `source*Id` 软引用并存）。

---

## 13. Final Conclusion（结语）

> TOT 要从**单人可用系统**走向**多人协同运营系统**，缺的不是"更多功能"，而是**"谁看到什么、谁能改什么、做完怎么交接、谁来确认"的一致结构**。

- ✅ 已明确**每类账户看什么/能做什么/不能做什么**（可见性矩阵 + 节点操作矩阵）。
- ✅ 已明确**节点如何交给下一环节**（交接链 + 交接必含项 + 人工确认 + 打回）。
- ✅ 已明确 **UI 如何统一显示责任/状态/证据/下一步**（顶部信息条 + 节点卡片 + 状态/证据统一）。
- ✅ 已明确**当前缺什么**（节点级权限 / 扩展状态 / Handoff·Review 记录 / 角色未接入）。
- ✅ 已明确**下一步代码先做哪层**：**Phase A（UI 统一，不动 DB）→ Phase B（角色视图 + 写保护）**，C/D 待试点后慎重推进。

> 本任务成功**不代表权限与交接功能已实现**；代表 **TOT 开始从"单人可用系统"升级为"多人协同运营系统"的设计阶段**。

### 架构结论（≥10 条）
1. 多人协同的真问题是"看什么/改什么/怎么交接/谁确认"，不是加功能。
2. 现有 6 角色枚举粗粒度且未接入；8 类业务角色无 1:1 映射——先用"角色→UI视图+写保护"，枚举扩展慎重（含 outsource 待定）。
3. 权限当前只有商家级（admin/own），**无节点级**——细粒度是 Phase B/C。
4. 节点 status（draft/completed/archived）**不足以表达提交/审核/打回**——需扩展状态，本文只设计。
5. 交接 = 人把责任交给下一个人，**不是系统自动流转**；系统/AI 只整理依据 + 提示。
6. 每次交接必含上游依据/缺口/风险/人工确认；打回必含原因 + 待补项；不自审自。
7. UI 统一：工作台顶部信息条 + 节点卡片统一结构 + 状态/证据统一标识。
8. 证据状态对接 E0–E3，是人工判断辅助、不自动放行。
9. AI（ai_worker 四职能）只生产草稿 + 审计，永不拍板；人类决策边界不可移动。
10. 落地序 **A（UI，不动 DB）→ B（角色视图 + 写保护）→ C（Handoff 轻量模型）→ D（审核/放行）**，每步守"人工确认、不自动流转、不提前平台化"。
11. 第一阶段先做"显示 + 手动状态"，避免错误自动化放大风险。
12. Human Commercial Authority 贯穿全程：签约/收费/试点/放量/进 MVS 全在人。

> 本文为只读架构分析；按 CHANGE_POLICY 属"新增文档（低风险）"。**未改动任何代码 / schema / migration / 现有权限逻辑**。系统只提供依据、不拍板，关键决策与放行均在人工。
