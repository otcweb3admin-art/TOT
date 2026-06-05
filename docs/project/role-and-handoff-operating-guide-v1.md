# Role & Handoff Operating Guide V1（角色分工与环节交接·操作指南）

> 类型：**内部操作指南（SOP）· 纯文档**　｜　日期：2026-06-05　｜　任务：TASK-058
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不改功能 / 不改权限 / 不进入 Phase D / 无审核流·Workflow·AI·MVS**。本文只输出文档。
> 读者：**TOT 内部团队**（采集 / 运营 / 执行 / 管理）。
> **以当前真实系统为准**（Phase A/B/C 已上线；Phase D 审核/打回/锁定**尚未实现**，本文不写）。
> 上承：[Role-Based UI & Stage Handoff Architecture V1](./role-based-ui-and-stage-handoff-architecture-v1.md) · [PROJECT_STATE](./PROJECT_STATE.md) · `app/lib/merchants/role-access.ts` · `app/lib/merchants/handoff-actions.ts`

---

## 第 1 章　使用说明

本指南用于内部团队操作**商家工作台、节点编辑权限、环节交接**。

它**不是**：审核制度 · 自动 Workflow · AI 决策流程 · MVS 流程 · 客户合同 · 绩效考核制度。

> **一句话**：系统帮你看清"谁负责、谁能改、谁交给谁、谁接收"；但**是否进入下一环节、是否放量、是否签约，永远由人确认**。

---

## 第 2 章　当前角色说明（真实 Role enum 6 个）

| 角色 | 定位 | 主要职责 | 可编辑 | 只读 | 禁止 |
|---|---|---|---|---|---|
| **admin** | 管理 / 最终配置 | 全局 + 兜底 + 商家分配 | **全部节点** | — | 让 AI/系统替代商业判断 |
| **collector** | 资料采集 / 录入 | 采真实事实进系统 | Merchant · Profile · Baseline · Operating Capacity · TB-003 素材 | 全链 | 下诊断、改方案、决定放量 |
| **operator** | 运营协调 / 审核占位 | 协调 + 诊断/复盘/计划 | Merchant · Operating Capacity · TB-001 诊断 · TB-007 复盘 · TB-008 计划 | 全链 | 直接改 Profile/Baseline/执行类方案、替商业负责人拍板 |
| **executor** | 方案 / 执行 | 做账号/素材/内容/直播/引流方案 | TB-002 账号 · TB-003 素材 · TB-004 内容 · TB-005 直播 · TB-006 引流 | 全链 | 改 Baseline/诊断/复盘/计划、创建商家、直接投流 |
| **ai_worker** | AI 辅助（只读） | 未来生成草稿/审计建议 | **无**（当前不直接写业务节点）| 全链 | 直接落库、直接提交交接、拍板 |
| **merchant** | 商家（未来门户）| 未来商家侧 | **无**（当前不开放内部编辑）| —（门户另行设计）| 编辑内部节点、提交内部交接 |

> 创建商家（`+ 新建商家`）：**仅 admin / collector / operator** 可建。

---

## 第 3 章　角色操作速查表

| 角色 | 可创建 / 编辑 | 可查看 | 可提交交接（从…）| 可接收交接（目标=…）| 不能做 |
|---|---|---|---|---|---|
| **admin** | 全部 + 创建商家 | 全部 | 任意节点 | 任意（含 admin）| 替 AI/系统拍板商业决策 |
| **collector** | Merchant/Profile/Baseline/OperatingCapacity/TB-003 | 全链 | 从它能编辑的节点 | 目标=collector | 编 TB-001/002/004/005/006/007/008 |
| **operator** | Merchant/OperatingCapacity/TB-001/007/008 + workspace 协调 | 全链 | 从它能编辑的节点 + workspace | 目标=operator | 编 Profile/Baseline/TB-002~006 |
| **executor** | TB-002/003/004/005/006 | 全链 | 从它能编辑的节点 | 目标=executor | 编 Baseline/TB-001/007/008、创建商家、投流 |
| **ai_worker** | 无 | 全链（只读）| **不可提交** | 不作为交接目标 | 写任何业务节点 |
| **merchant** | 无 | （门户未开）| **不可提交** | 不作为内部交接目标 | 编辑/提交内部节点 |

> 交接表单的"接收角色"目前可选 **collector / operator / executor / admin**（ai_worker / merchant 不作为接收目标）。
> **接收/取消的硬规则**：接收 = 目标角色或 admin；取消 = 提交人或 admin（且仅限 `submitted` 状态）。

---

## 第 4 章　节点职责速查表

| 节点 | 谁主要填写 | 谁可编辑 | 完成后建议交给（接收角色）| 需要注意 |
|---|---|---|---|---|
| **Merchant** | collector / operator | admin·collector·operator | → Profile（collector）| 主体≠诊断，别塞备注 |
| **Profile** | collector | admin·collector | → Baseline / OperatingCapacity / TB-001（operator）| Offer 3 秒可懂；不知道写待补充 |
| **Baseline** | collector | admin·collector | → TB-001（operator）| 标可信度；口述不可 high |
| **Operating Capacity** | collector / operator | admin·collector·operator | → TB-001 / 工作台五器官 | 决定能否放量；老板单点如实记 |
| **TB-001 Diagnosis** | operator | admin·operator | → TB-002/003/004（executor）| 根因非建议合集；缺证据写待验证 |
| **TB-002 Account Setup** | executor | admin·executor | → TB-003 / TB-004 | 须看上游诊断 |
| **TB-003 Material Collection** | collector / executor | admin·collector·executor | → TB-004 | 缺素材标缺口 |
| **TB-004 Content Operation** | executor | admin·executor | → TB-005 / TB-006 | 禁区/频率如实 |
| **TB-005 Live Planning** | executor | admin·executor | → TB-006 | 准备度如实 |
| **TB-006 Lead Conversion** | executor | admin·executor | → TB-007（operator）| **归因方式必填**；无归因不投流 |
| **TB-007 Data Review** | operator | admin·operator | → TB-008（operator）| 需真实结果；勿强行 completed |
| **TB-008 Growth Plan** | operator / admin | admin·operator | → 下一轮 / 项目负责人 | 需复盘依据；无依据只 draft |
| **Workspace** | operator / admin | （只读总览）| —（协调/人工确认）| 提示≠系统决策 |

> ⚠ **TB-003 素材** 由 collector 与 executor 共同可编辑（采集与方案衔接处）。

---

## 第 5 章　工作台怎么看

打开 `/dashboard/merchants/[id]/workspace`，自上而下：

- **DEMO 提示**（仅 DEMO 商家）：红色"演示数据，不得用于 MVS/ROI/真实案例"。
- **阶段摘要（运营协同）**：当前登录角色 · 当前负责人 · 链路状态(X/总) · 当前阶段(第一个待创建节点) · 建议关注器官 + "系统提示不代表业务决策"。
- **下一步规则提示**：链路首个 missing 节点（规则,非 AI）。
- **经营健康摘要（五器官）**：Channel/Offer/Fulfillment/Cashflow/Organization（signal/attention/missing/unknown）。
- **资产链路（节点卡片）**，每个节点显示：编号 · 状态徽章 · **可编辑 / 只读（建议）** · 建议负责角色 · 上游输入 · 证据提示 · 下一步 · 交接提示 · 人工确认提示 · 进入/查看按钮。
- **环节交接记录**：交接列表 + `+ 新增交接记录` + 角色感知的"标记已接收/取消"按钮。

> **强调**：工作台所有提示都是"建议/规则",**不是系统决策**。可编辑/只读只是分工提示+写保护,不代表"已批准"。

---

## 第 6 章　什么时候应该创建交接

以下情况可创建交接（fromNode → toNode）：

- 资料采集完成 → 交给诊断（profile/baseline/operating_capacity → diagnosis，接收 operator）
- 诊断完成 → 交给方案（diagnosis → account_setup/content_operation，接收 executor）
- 账号/素材/内容准备完成 → 交给执行或引流（→ lead_conversion，接收 executor）
- 引流转化方案完成 → 交给复盘准备（lead_conversion → data_review，接收 operator）
- 复盘完成 → 交给 90 天计划（data_review → growth_plan，接收 operator）
- 90 天计划完成 → 交给下一轮 / 项目负责人确认（growth_plan → workspace，接收 admin/operator）

> **交接不是审批。** 交接只是"**我已把这部分工作和依据递交给下一个角色**"。

---

## 第 7 章　如何创建交接记录

页面：`/dashboard/merchants/[id]/handoffs/new`（工作台「+ 新增交接记录」进入）。填写：

| 字段 | 怎么写 |
|---|---|
| **fromNode** | 你刚完成的来源节点 |
| **toNode** | 要交给的目标节点 |
| **receivedByRole** | 接收角色（collector/operator/executor/admin）|
| **summary** | **写事实,不写漂亮话**——这次交接交了什么 |
| **gapSummary** | **必写缺口**——还差什么、哪里待补充 |
| **riskSummary** | **必写风险**——已知风险/红旗 |
| **evidenceSummary** | **必写依据来源**——上游引用、数据来源、证据级别 |

> 提交后状态 = `submitted`,回到工作台。**本操作不会自动改任何节点状态、不会放行、不会锁定上游。**
> 你只能从"你有编辑权限的节点"提交交接（ai_worker / merchant 不可提交）。

---

## 第 8 章　如何接收交接

目标角色登录后,在工作台「环节交接记录」里能看到发给自己的交接。若**当前角色 = receivedByRole 或为 admin**,会出现「**标记已接收**」按钮,点击即记录接收。

**"接收"的含义**：
- ✅ 我已看到上游交接 · 我知道可以开始下一步准备
- ❌ **不代表**我已审核通过 · **不代表**我认可所有结论 · **不代表**系统自动放行

> 接收只写 `received` + 接收人 + 接收时间。**不改任何节点状态、不放行、不审批。**

---

## 第 9 章　如何取消交接

**提交人本人或 admin** 可取消 `submitted` 状态的交接（点「取消」）。适用：

- 交错节点 / 交错角色 · summary 写错 · 发现重大缺口 · 需要重新补资料

> **取消 ≠ 打回。** 取消是"撤回这条交接记录";**打回 / 审核属于未来 Phase D（当前未实现）**。已 `received` 的交接当前不可取消。

---

## 第 10 章　哪些事情不能用交接替代

交接记录**不能替代**以下任何一项（这些仍由人/未来模块负责）：

- ⛔ 商业决策　⛔ 审核通过　⛔ MVS 验证　⛔ ROI 结论　⛔ 投流授权
- ⛔ 放量决定　⛔ 客户承诺　⛔ 经验入库（Experience）　⛔ 合同 / 收费决策

> 看到工作台/交接里写了"完成""已接收",**不等于可以投流、可以放量、可以收费**——那些是人的决策点。

---

## 第 11 章　角色协同示例（DEMO 演练）

```
collector：完成 Profile / Baseline / Operating Capacity
   └─创建交接：operating_capacity → diagnosis，接收角色 operator
        │
operator：标记已接收 → 完成 TB-001 Diagnosis
   └─创建交接：diagnosis → account_setup（或 content_operation），接收角色 executor
        │
executor：标记已接收 → 完成 TB-002 ~ TB-006
   └─创建交接：lead_conversion → data_review，接收角色 operator
        │
operator：标记已接收 → 后续等真实数据再做 TB-007 / TB-008
```

> 每一步"标记已接收"都只是"我开始接手",**进入下一环节/放量仍需人工确认**。

---

## 第 12 章　常见错误（避免）

- ❌ 把交接当审批（交接 ≠ 放行）
- ❌ 没写风险就交接 / 没写缺口就交接
- ❌ evidenceSummary 证据来源不清（口述当事实）
- ❌ 想用 ai_worker 直接写业务节点（系统会拒）
- ❌ 用 merchant 账号编辑内部节点（系统会拒）
- ❌ collector 填诊断结论 / executor 改 Baseline / operator 跳过证据直接写计划（系统会拒,且违纪律）
- ❌ 交接后以为可以自动投流 / 自动放量（不会）

---

## 第 13 章　当前系统边界

| 已实现（Phase A/B/C）| 未实现（不要假设有）|
|---|---|
| ✅ 工作台角色提示 / 当前登录角色 | ⛔ 审核通过（approved）|
| ✅ 节点级写保护（可编辑/只读）| ⛔ 打回修改（rejected / needs_revision）|
| ✅ 交接记录（submitted）| ⛔ 锁定节点（locked）|
| ✅ 标记已接收（received）| ⛔ 自动流转 / 节点状态自动变化 |
| ✅ 取消交接（cancelled）| ⛔ MVS / AI 自动提交 / 商家门户 |

> **交接不会改变任何节点状态**,不会自动放行。

---

## 第 14 章　什么时候进入 Phase D

**只有当真实多人试点出现以下需求时,再考虑 Phase D**（不要提前做）：

- 需要正式**审批** / 需要**打回** / 需要**锁定**已通过节点
- 需要区分 `submitted / approved / rejected`
- 需要**审计记录** / 防止已通过节点被改 / 多人责任追踪

> 在真实需求出现前,Phase C 的"记录 + 接收 + 取消"已足够支撑内部最小协同；提前做审批流 = 过度设计（违 CODE.md 不提前平台化）。

---

## 第 15 章　结论

> 当前系统已支持**最小多人协同**：**谁负责 · 谁能改 · 谁交给谁 · 谁接收 · 哪些仍需人工确认**。

- ✅ 每个角色知道看什么、改什么、不能改什么
- ✅ 知道何时创建交接、如何接收、何时取消
- ✅ 知道**交接不是审批**,系统提示不是决策
- ✅ 知道当前系统边界,不误以为已有完整 Workflow

> 本任务成功**不代表 Phase D 完成**;代表 **TOT 拥有了第一版内部多人协同操作指南**。**是否进入下一环节、是否放量、是否签约,永远由人确认（Human Commercial Authority）。**

---

> 本文为只读内部操作指南；按 CHANGE_POLICY 属"新增文档（低风险）"。**未改动任何代码 / schema / migration / 权限**,以当前真实系统为准,未写未实现的 Phase D 能力。
