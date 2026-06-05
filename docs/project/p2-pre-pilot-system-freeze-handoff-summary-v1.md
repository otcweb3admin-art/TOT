# P2 Pre-Pilot System Freeze & Handoff Summary V1（P2 真实试点前·系统封板与交接总结）

> 类型：**系统封板交接文档（只读快照）· 纯文档**　｜　日期：2026-06-05　｜　任务：TASK-060
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不创建账号 / 不改角色 / 不创建真实商家 / 不改真实数据 / 无新功能·MVS·Phase D·Workflow·AI·Experience**。本文只输出文档。
> 定位：**不是架构蓝图,不是新功能设计**——这是 P2 真实试点前的**系统封板交接文档**,让任何后续接手者知道：系统现处什么状态、哪些可用、哪些边界不能越、下一步何时启动、启动前查什么。
> 封板基准：HEAD `f51f715` · 以当前真实系统为准。

---

## 第 1 章　Executive Summary（结论摘要）

> **TOT 当前已进入"真实商家试点前准备态"（Pre-Pilot Ready / Conditional Go）。**

**系统已具备**：商家录入 · 资产链路(TB-001~008) · 工作台 · 经营健康观察(五器官) · 角色分权 · 节点写保护 · 环节交接记录 · DEMO 演示 · Smoke 回归 · 线下采集工具。

**尚未进入**：真实商家录入 · MVS · ROI 验证 · Phase D 审核流 · AI 自动操作 · Experience Base。

> 封板态实测（2026-06-05）：`git` 干净 · **`smoke:p2` 49/49 PASS** · 15 migrations · DEMO 在 · 真实试点商家 = 0。

---

## 第 2 章　Completed Capability Inventory（已完成能力清单）

| 类别 | 已完成 |
|---|---|
| **Foundation** | P0（Next16+Prisma+Supabase+Vercel）· P1（Auth+Role）· P2 主链 |
| **Merchant Assets** | Merchant · MerchantProfile · MerchantBaselineMetric · MerchantOperatingCapacity · TB-001~TB-008（共 11 个 1-1 资产）|
| **Workspace** | 链路状态 · 五器官摘要 · 角色 UI(阶段摘要+节点卡片) · 交接记录区块 |
| **Permission** | 商家级权限 · 节点级写保护 · `role-access` helper |
| **Handoff** | submitted · received · cancelled（记录-接收-取消）|
| **Demo / Training** | `DEMO_小吃车增长样例` · Demo badge · `seed:demo` / `seed:demo:clean` |
| **Testing** | `npm run smoke:p2`（49 项断言）|
| **Documents** | Playbook · Readiness Gate · Interview Checklist · Field Pack · Dry Run · Role&Handoff Guide · Account Setup Guide · 本封板文档 |

---

## 第 3 章　Current Database / Model State（当前模型状态）

**15 migrations · schema up to date。** 当前模型：

- `UserProfile`（authUserId/email/role/status,JIT 建档）· `Role`(6) · `UserStatus`(2)
- `Merchant`（根实体）+ **11 个 1-1 资产**：Profile · BaselineMetric · Diagnosis · AccountSetup · MaterialCollection · ContentOperation · LivePlanning · LeadConversion · DataReview · NinetyDayGrowthPlan · **OperatingCapacity**
- `MerchantStageHandoff`（1-to-many）+ `MerchantStageNode`(13) + `MerchantStageHandoffStatus`{submitted,received,cancelled}
- 各资产状态枚举 `*Status`{draft,completed,archived}（部分）· `MerchantStatus` · `BaselineDataConfidence`

**当前没有**：Handoff approval · Review record · Node lock · MVS result model · Experience model · Organization/Tenant model · File upload model。

---

## 第 4 章　Current Role / Account State（角色 / 账号状态）

- Role enum **6 个**：`merchant / collector / operator / executor / admin / ai_worker`
- **`admin@tot.local` 当前实际角色 = `operator`**（开发/演示/operator 验证账号）
- **JIT 默认 role = `operator`**（新账号首登即 operator）
- **尚未创建多角色账号**（profiles 共 1 个）
- 尚未实现：账号管理 UI · invite · tenant / team

> ⚠ **不要把 `admin@tot.local` 误认为真正 admin**——它是 operator。真实 admin 应另建（见 Account Setup Guide）。

---

## 第 5 章　Current Permission State（权限状态）

- **商家级**：`admin` 全见;其它角色仅 `ownerProfileId / createdByProfileId` 命中的商家可见可写。
- **节点级**：`role-access` 控制写入——admin 全部;collector=画像/基线/承接/素材;operator=诊断/复盘/计划/承接;executor=账号/素材/内容/直播/引流;ai_worker & merchant 不可写内部节点。
- admin 可兜底编辑(≠系统决策)。

**当前没有**：DB row-level policy 细分 · 节点级只读页面隔离(节点编辑页本身无只读版,靠 Server Action 写保护兜底) · 审核锁定 · 多租户组织隔离。

---

## 第 6 章　Current Handoff State（交接状态）

**已实现**：创建交接 · 标记 received · 取消 submitted · summary/gap/risk/evidence · fromNode/toNode · receivedByRole。

**未实现**：审批通过(approved) · 打回修改(rejected/needs_revision) · 锁定节点(locked) · 自动改变节点状态 · 自动进入下一环节 · 自动通知。

> ⚠ **received ≠ approved;交接 ≠ 放行。** 交接只记录"我把工作和依据递交/接手",不改任何节点状态、不放行。

---

## 第 7 章　Current DEMO / Training State（DEMO 状态）

- `DEMO_小吃车增长样例` 存在（含完整 11 资产链 + 五器官 attention 示例）。
- DEMO 数据**仅用于演示 / 培训**;**不得用于 MVS / ROI / 归因 / Experience / 真实案例**（每字段已标演示声明 + UI 红色 DEMO 提示）。
- `npm run seed:demo` 可恢复 · `npm run seed:demo:clean` 可清理（严格 `name startsWith "DEMO_"`）。
- smoke 使用 `SMOKE_TEST_` 前缀,**与 DEMO 独立**(自建自删,不碰 DEMO/真实数据)。

---

## 第 8 章　Current Test / Verification State（测试状态）

- `npm run smoke:p2` 是当前**最小主链回归**(DB+helper 层,49 项)。覆盖：权限 helper · workspace helper · OHC 五器官 helper · OperatingCapacity · role-access · handoff。
- **smoke ≠ 完整 E2E / CI**(无浏览器自动化、无 CI 流水线)。
- **真实商家数据从未跑过**——这是试点要消除的最大未知。

---

## 第 9 章　What The System Can Do Now（当前可以做）

✅ 内部登录 · 查看 DEMO 商家 · 创建商家 · 填 Profile/Baseline/Operating Capacity · 填 TB-001~TB-008 · 看 Workspace · 看五器官 · 看 role UI · 按 role 写入节点 · 记录交接 · 接收交接 · 取消交接 · 跑 smoke · 用 Field Pack 线下采集。

---

## 第 10 章　What The System Must Not Be Used For Yet（当前禁止使用）

⛔ 承诺增长结果 · 计算 ROI · 做 MVS · 把 DEMO 当真实案例 · 把 handoff 当审批 · 把 received 当通过 · 让 AI 直接写业务节点 · 让 merchant 账号编辑内部节点 · 直接放量/投流 · 进入 Experience Base · 多人共享 admin · **在无真实基线时声称增长**。

---

## 第 11 章　Pre-Pilot Launch Checklist（试点前检查清单）

- ☐ `smoke:p2` 通过
- ☐ DEMO 仍标识清楚（红色提示 + name 前缀）
- ☐ 账号准备清楚（角色明确,见 Account Setup Guide）
- ☐ 项目负责人确认
- ☐ Field Pack 已打印 / 可用
- ☐ Playbook 已阅读
- ☐ Evidence discipline 已确认（不编、标缺口、标可信度）
- ☐ 不进入 MVS · 不放量 · 不投流
- ☐ 只接 1 家 · 缺口允许待补充 · 不编数据

---

## 第 12 章　First Real Merchant Trigger Conditions（首个真实商家触发条件）

**全部满足才启动真实接入**：
- ☐ 用户 / 项目负责人**明确授权**
- ☐ 已确定**具体商家** · 商家有合作意向
- ☐ 商家愿意提供基础资料 · 愿意提供经营数据或说明缺口 · 愿意配合复盘
- ☐ 内部负责人明确
- ☐ **不以一次录入承诺增长** · 接入范围限定为**资料采集与诊断准备**

---

## 第 13 章　Recommended First Real Merchant Flow（首个真实商家第一天流程）

1. 线下用 **Field Pack** 采集
2. 回系统**创建 Merchant**
3. 填 **Profile** → 4. 填 **Baseline** → 5. 填 **Operating Capacity** → 6. 填 **TB-001 诊断**
7. 视资料完整度填 **TB-002~TB-006 draft**
8. 打开 **Workspace 检查** → 9. 看**五器官缺口** → 10. 创建必要 **handoff** → 11. **人工决定**是否继续执行准备

> ⚠ **TB-007 / TB-008 不应在无真实执行结果时强行 completed**(可留 draft 记初步方向)。

---

## 第 14 章　Known Gaps / Deferred Work（已知延后项）

⛔ Phase D 审核/打回/锁定 · MVS/ROI/归因模型 · Experience Base · AI worker 自动草稿/审计 · 文件上传/证据附件 · 账号管理 UI · 多租户/team · 商家门户 · CI/E2E 测试 · 通知系统 · 更细角色枚举(PM/Commercial/Viewer/Outsource)。

> 以上**均为有意延后**(守 CODE.md 不提前平台化),应由真实试点需求驱动,不提前做。

---

## 第 15 章　Stop Conditions（停止条件）

出现以下任一,**停止继续开发或停止试点动作**,先回报人：
- smoke 不通过 · git 工作区不干净
- 真实数据被 DEMO / SMOKE 混淆
- 账号角色不清 · 无负责人
- 无基线却要声称增长 · 无承接能力却要投流
- handoff 被误认为审批
- 需要 Phase D 但尚未设计
- 有密钥泄露风险

---

## 第 16 章　Final Recommendation（最终建议）

- **当前系统状态：Pre-Pilot Ready / Conditional Go。**
- ❌ 不建议继续新增功能（边界已足够支撑试点）
- ❌ 不建议进入 MVS · ❌ 不建议进入 Phase D · ❌ 不建议立即建复杂账号系统
- ✅ **建议等待真实商家**;真实商家出现后,按 **Field Pack + Playbook + Workspace + Handoff** 运行。

> **是否启动真实试点、接哪一家、是否建多角色账号、是否升 admin = 业务决策,由项目负责人/管理层定（Human Commercial Authority,AI 不拍板）。**

---

> 本文为只读封板交接文档；按 CHANGE_POLICY 属"新增文档（低风险）"。**未改动任何代码 / schema / migration / 账号 / 角色 / 真实数据**,以当前真实系统为准,未写未实现能力。**TOT 至此完成 P2 真实试点前系统封板。**
