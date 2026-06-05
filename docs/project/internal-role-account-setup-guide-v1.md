# Internal Role Account Setup Guide V1（内部角色账号准备与权限验证指南）

> 类型：**内部账号准备指南（SOP）· 纯文档**　｜　日期：2026-06-05　｜　任务：TASK-059
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不创建账号 / 不改数据库 / 不改用户角色 / 不输出任何真实密码 / 无账号管理 UI·邀请·多租户·Phase D·Workflow·AI·MVS**。本文只输出文档。
> 读者：**项目负责人 / 管理员 / 内部团队**。以**当前真实系统**为准（不写尚未实现的账号管理能力）。
> 上承：[Role & Handoff Operating Guide V1](./role-and-handoff-operating-guide-v1.md) · [Role-Based UI & Stage Handoff Architecture V1](./role-based-ui-and-stage-handoff-architecture-v1.md) · [PROJECT_STATE](./PROJECT_STATE.md) · `app/lib/auth/dal.ts` · `app/lib/merchants/role-access.ts`

> ⚠️ **安全红线**：本文及任何提交/聊天中**绝不出现真实密码、token、service role key**。账号实际创建与密码分发由**人**在受控环境完成,本文只给规则与清单。

---

## 第 1 章　Purpose（目的）

本指南用于**准备内部测试 / 演示 / 运营账号**——明确需要哪些账号、各是什么角色、怎么用、怎么验证权限、密码怎么安全管理、谁有权创建/分配/停用。

它**不是**：自动账号系统 · 邀请系统 · 员工管理系统 · 多租户系统 · 权限审批制度。

> **本任务不创建任何账号、不改任何角色**——只给"怎么准备"的说明。

---

## 第 2 章　Current Auth / Role State（当前真实状态）

| 项 | 现状 |
|---|---|
| Supabase Auth | ✅ 已可用（邮箱密码登录 + proxy 守卫）|
| UserProfile JIT | ✅ 首次登录自动建档（`lib/auth/dal.ts`）|
| Role enum | 6 个：`merchant / collector / operator / executor / admin / ai_worker` |
| **JIT 默认角色** | **`operator`**（schema `@default(operator)`）——新账号首登即 operator |
| **`admin@tot.local`** | 当前实际角色 = **`operator`**（开发/演示/operator 验证账号）|
| 角色配置 | **目前需人工配置**（DB / 受控脚本）——系统不自动决定角色 |
| 账号管理 UI | ❌ 未实现 |
| 组织 / team / tenant | ❌ 未实现 |

> ⚠ 因 JIT 默认 `operator`,**任何新登录账号一开始都是 operator**;要成为 collector/executor/admin 必须人工改 role（业务决策,见第 11 章）。

---

## 第 3 章　Role Account Types（建议准备的账号类型）

| # | 账号类型 | 角色 | 用途 |
|---|---|---|---|
| 1 | **Admin Account** | `admin` | 全局 + 兜底 + 账号/商家分配（不日常录入,见第 10 章）|
| 2 | **Collector Account** | `collector` | 资料采集 / 录入（Profile/Baseline/承接/素材）|
| 3 | **Operator Account** | `operator` | 运营协调 + 诊断/复盘/计划 |
| 4 | **Executor Account** | `executor` | 账号/素材/内容/直播/引流方案执行 |
| 5 | **Viewer / Demo Account** | （**当前无独立 Viewer 角色**）| 演示/培训 → 暂用 collector/operator **只读演示**（看而不存）|
| 6 | **AI Worker Account** | `ai_worker` | **暂不开放真人登录**;为未来 AI 草稿/审计预留,当前不可写业务节点 |
| 7 | **Merchant Account** | `merchant` | **未来商家门户**,不用于内部操作 |

---

## 第 4 章　Recommended Test Accounts（建议命名 · 无密码）

> 仅给**命名建议**,**不含任何密码**。实际是否创建由项目负责人决定。

| 建议邮箱 | 角色 | 备注 |
|---|---|---|
| `admin.owner@tot.local` | admin | 真实管理账号（另行创建,不复用现有）|
| `collector.demo@tot.local` | collector | 采集演示 |
| `operator.demo@tot.local` | operator | 运营演示 |
| `executor.demo@tot.local` | executor | 执行演示 |
| `viewer.demo@tot.local` | （暂不创建 / 用 collector 只读演示）| 无独立 Viewer 角色 |

> ⚠ **`admin@tot.local` 当前不要改**：继续保留为 `operator` 验证账号,**除非项目负责人明确决定**。新增真实 admin 请用 `admin.owner@tot.local` 之类**另建**。

---

## 第 5 章　Password & Secret Handling Rules（密码与密钥规则）

**必须遵守：**
- ❌ 不在聊天 / 工单里发送真实密码
- ❌ 不在 Git 中提交密码
- ❌ 不在文档中写密码（含本文）
- ✅ 密码通过**安全渠道单独分发**（密码管理器 / 一次性安全链接）
- ✅ **测试密码与真实员工密码分开**
- ✅ 测试账号上线前**更换密码或停用**
- ❌ **service role key 不得给普通员工**（仅管理员/受控脚本使用）
- ❌ **不用共享 admin 账号做日常录入**（一人一号,见第 9/10 章）

---

## 第 6 章　Manual Account Creation Procedure（人工创建流程 · 本任务不执行）

当前**无账号管理 UI**,账号由**项目负责人/管理员**在 Supabase 后台或受控脚本中创建。**本任务不创建账号。** 建议流程：

1. **项目负责人**决定需要哪些账号（角色 + 数量 + 用途）
2. **管理员**在 Supabase Auth 创建用户（邮箱 + 安全分发的密码）
3. 该用户**首次登录** → 系统 JIT 创建 UserProfile（默认 `operator`）
4. **管理员人工设置 role**（改为目标角色,受控操作）
5. 运行**权限验证**（第 7 章清单）
6. **记录账号用途**（谁、什么角色、为何）

> ⚠ **不要让系统自动决定账号角色**——角色是人工 + 业务决策。

---

## 第 7 章　Role Verification Checklist（角色权限验证清单）

> 每个账号配置好 role 后,登录工作台逐项验证（对照 `role-access.ts` 真实映射）。

**Collector**
- ☐ 可看自己负责的商家
- ☐ 可编辑 **Profile / Baseline / Operating Capacity / Materials(TB-003)**
- ☐ **不可保存** Lead Conversion / Data Review / Growth Plan（保存应被拒/工作台显"只读"）

**Operator**
- ☐ 可编辑 **Diagnosis(TB-001) / Data Review(TB-007) / Growth Plan(TB-008) / Operating Capacity**
- ☐ 可查看全链路
- ☐ 可创建 / 接收相关交接（目标=operator 的可接收）

**Executor**
- ☐ 可编辑 **Account Setup / Materials / Content Operation / Live Planning / Lead Conversion**
- ☐ **不可保存** Baseline / Diagnosis / Growth Plan

**Admin**
- ☐ 可看全部 · 可编辑全部 · 可取消交接
- ☐ 但**不代表可绕过商业决策**（admin ≠ 系统决策）

**ai_worker**
- ☐ **不应作为真人账号使用**;不应直接写业务节点（系统会拒）

**merchant**
- ☐ 当前**不开放内部工作台编辑**

> 验证方式参考:可由管理员临时给测试账号配相应 role,登录后核对"可编辑/只读"徽章 + 尝试保存。（也可后续做只读权限验证脚本,本任务不实现。）

---

## 第 8 章　Demo / Training Account Policy（演示 / 培训账号政策）

- DEMO 商家（`DEMO_小吃车增长样例`）用于**培训**;培训账号可查看 DEMO 商家。
- ❌ **不得用 DEMO 操作截图作为真实客户成果**（DEMO 数据已标"不得用于真实案例"）。
- ❌ **不得让新人在真实商家上练手**。
- ✅ 新人练习应使用 **DEMO 或未来专门 training 数据**。

---

## 第 9 章　Real Staff Account Policy（真实员工账号政策）

未来真实员工账号：
- ✅ 使用**个人邮箱**（一人一号）
- ❌ 不共享账号
- ✅ **离职停用**
- ✅ **最小权限分配**——只给必要角色
- ✅ 角色变更需**项目负责人确认**（第 11 章）

---

## 第 10 章　Admin Account Policy（admin 账号风险政策）

- admin 可**兜底编辑**全部节点,但 **admin ≠ 系统决策**（仍守 Human Commercial Authority）。
- ❌ admin **不应日常录入**（用对应角色账号录入）。
- ✅ admin 操作应**少而有记录**（节点已记 createdBy/updatedBy）。
- ❌ **不应多人共享同一个 admin 账号**。

---

## 第 11 章　Role Change Policy（角色变更政策）

**何时可改角色**：岗位变化 · 测试需要 · 修正权限错误 · 试点阶段变更。
**谁可决定**：**项目负责人 / 公司管理层** 决定,**管理员**执行(受控 DB/脚本)。

> **系统不自动决定角色。** 角色变更 = 业务决策 + 人工执行,**AI 不拍板**。

---

## 第 12 章　Account Deactivation Policy（账号停用政策）

**何时停用**：测试结束 · 员工离开 · 账号泄露风险 · 角色不再需要。

> 当前**未实现 UI 停用流程**（schema 有 `UserStatus{active,disabled}` 字段,但无停用界面）。停用需通过 **Supabase 后台或后续工具**人工处理。

---

## 第 13 章　Go-Live Before Real Pilot（首个真实商家前的账号准备）

**最少准备（多人协同目标态）**：
- 1 个 `operator` · 1 个 `collector` · 1 个 `executor` · 1 个 `admin`

**如果只有一人操作**：
- 可以**先用 operator**（当前 `admin@tot.local`）跑通;
- 但**必须知道这不是最终多人运营方式**——单账号无法体现角色分工/交接协同。

---

## 第 14 章　What This Guide Does Not Implement（明确未实现）

| 未实现（不要假设有）|
|---|
| ⛔ 邀请系统 · 账号管理后台 · 密码重置流程 |
| ⛔ 组织架构 · 团队 / tenant |
| ⛔ 审批流 · Phase D |
| ⛔ 商家门户 · AI Worker 自动操作 |

> 账号创建/停用/角色变更目前**全靠人工 + Supabase 后台/受控脚本**。

---

## 第 15 章　Final Recommendation（最终建议）

1. **当前先保留 `admin@tot.local` 为 `operator`**（operator 验证账号,勿擅改）。
2. **新增真实 admin 账号应另行创建**（如 `admin.owner@tot.local`）,不复用现有。
3. 为内部演示准备 **collector / operator / executor** 分角色账号（命名见第 4 章,密码安全分发）。
4. **真实试点前至少跑一次角色权限验证**（第 7 章清单）。
5. **不要共享 admin 密码**;service role key 仅管理员/脚本用。
6. 是否创建账号、是否把某账号设为 admin = **业务决策,由项目负责人/管理层定**(AI 不拍板)。

---

> 本文为只读内部准备指南；按 CHANGE_POLICY 属"新增文档（低风险）"。**未创建任何账号、未改任何角色、未改代码/schema/数据库,未输出任何密码**,以当前真实系统为准。
