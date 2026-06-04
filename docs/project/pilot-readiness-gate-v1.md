# Pilot Readiness Gate V1（首批真实商家试点·就绪门禁）

> 类型：**只读就绪评估（Readiness Gate）· 纯文档**　｜　日期：2026-06-04　｜　任务：TASK-047
> 范围：**只读检查 + 跑 `npm run smoke:p2`**。**不写代码 / 不改 schema / 不新增 migration / 不创建真实商家 / 不修改数据库真实数据。**
> 本文只回答一件事：**TOT 现在是否已具备启动"首个真实商家试点"的最小条件？给出 Go / Conditional Go / Hold 建议（供人决策）。**
> 上承：[PROJECT_STATE](./PROJECT_STATE.md) · [pilot-merchant-intake-playbook-v1](./pilot-merchant-intake-playbook-v1.md) · [merchant-operating-health-check-architecture-v1](./merchant-operating-health-check-architecture-v1.md) · [merchant-validation-system-architecture-v1](./merchant-validation-system-architecture-v1.md) · [evidence-framework-specification-v1](./evidence-framework-specification-v1.md) · [merchant-success-architecture-v1](./merchant-success-architecture-v1.md)

---

## ⚠️ 门禁的边界（最高约束）

> **本门禁只评估、只给建议——它本身不授权任何事。** 是否真的启动试点、接哪一家、何时开始，**由人（商务 / 项目负责人 / 管理层）决定**（Human Commercial Authority）。本文给出的"Conditional Go"是**对系统就绪度的技术判断**，不是商业放行。

---

## 1. 门禁目的（What this gate is）

在投入真实商家之前，先用一道**只读、可复核**的检查回答："**系统、流程、证据纪律是否已就位到可以安全地接入第一个真实商家？**"

- **它是**：一次对现有能力 + 实测健康信号的盘点 + 一个分维度就绪判断 + 一个 Go/Conditional Go/Hold 建议。
- **它不是**：开发任务 / 真实商家创建 / 数据库写入 / 商业决策。

---

## 2. 评估方法（Method · 只读 + 实测，全部带证据）

| 手段 | 内容 | 是否触碰真实数据 |
|---|---|---|
| **只读盘点** | git 状态、HEAD/tag、migration 数、模型清单、路由清单、关键文档 | 否（只读）|
| **实测** | `npm run smoke:p2`（DB + helper 层；仅 `SMOKE_TEST_` 夹具，跑完自动清理）| 否（夹具自建自删，真实数据零改动）|
| **复核** | 跑前后查真实商家/资产计数一致 | 否（只读计数）|

> 证据原则：本门禁的每条判断都基于**可复现的只读事实**或**实测输出**，不含 E0 猜测（呼应[证据宪法](./evidence-framework-specification-v1.md)）。

---

## 3. 能力盘点（只读确认 · 2026-06-04）

| 维度 | 现状（只读事实）|
|---|---|
| **代码仓库** | `git status` 干净；HEAD `45dd057`（TASK-046 已封板）；checkpoint tag 链完整至 `checkpoint-pilot-intake-playbook-v1` |
| **数据库** | `prisma migrate status` = **14 migrations · up to date**（schema 与库同步）|
| **业务模型** | Merchant 根 + **11 个 1-1 资产**：Profile / BaselineMetric / Diagnosis(TB-001) / AccountSetup(TB-002) / MaterialCollection(TB-003) / ContentOperation(TB-004) / LivePlanning(TB-005) / LeadConversion(TB-006) / DataReview(TB-007) / NinetyDayGrowthPlan(TB-008) / **OperatingCapacity** |
| **页面/路由** | 12 个节点路由 + 工作台：profile / baseline / operating-capacity / diagnosis / account-setup / materials / content-operation / live-planning / lead-conversion / data-review / growth-plan / **workspace** |
| **身份与权限** | P1 Auth（`@supabase/ssr` + proxy 守卫，线上端到端已验证）；商家级权限隔离（admin 全见 / 其它仅自有 owner\|createdBy；页面 404 / action 拒绝）|
| **经营健康** | 五器官只读摘要（工作台）+ 经营承接能力采集（履约/组织），履约/组织已从弱信号升级为可采集事实 |
| **接入流程** | [试点接入操作手册 V1](./pilot-merchant-intake-playbook-v1.md)（16 章 SOP）已封板 |
| **回归保护** | `npm run smoke:p2`（30 项断言）+ 测试数据自动清理 |
| **线上部署** | `tot-dun.vercel.app`（Root Directory=app）；`/health` 可达 |
| **真实数据现状** | 仅 1 条验证夹具「测试商家A」+ 1 个 UserProfile（`admin@tot.local`，role=operator）；**尚无真实试点商家** |

---

## 4. 实测信号（Smoke Test · 2026-06-04）

```
=== P2 SMOKE TEST (DB + helper layer) ===
[permission helper]  6/6 PASS   （owner/other/admin 可见性 + 写权限谓词）
[workspace helper]   9/9 PASS   （满链 10 节点 / 空商家首缺=profile）
[operating health]   8/8 PASS   （满链 5 器官 / 空商家 missing+unknown 不伪装健康）
[operating capacity] 5/5 PASS   （采集→履约 signal / 组织风险 attention / 来源含采集）
=== SUMMARY: 30 passed / 0 failed; cleanup CLEAN -> PASS ✅ (exit 0)
```

- **结果**：**30/30 通过，cleanup CLEAN，退出码 0。**
- **真实数据零改动**：跑后复核 = 仅「测试商家A」+ 1 profile，`SMOKE_TEST_` 残留 = 0，operatingCapacity 行 = 0。
- **结论**：P2 主链的核心数据关系、商家级权限、工作台状态计算、五器官 + 经营承接能力映射，**当前全部健康可复现**。

---

## 5. 就绪度分维评估（Readiness Dimensions）

> 信号：✅ 就绪　⚠️ 有条件就绪（可上但需控制）　⛔ 未就绪（本阶段不应依赖）

| # | 维度 | 信号 | 依据 / 说明 |
|---|---|:--:|---|
| 1 | 身份认证 / 线上可用 | ✅ | P1 线上端到端已验证；proxy 守卫；部署可达 |
| 2 | 商家创建 + 主体管理 | ✅ | Merchant 根实体 + 列表/创建/详情闭环 |
| 3 | 资产采集链路（Profile→TB-008）| ✅ | 11 资产 1-1，逐级软引用上游，创建/编辑闭环 |
| 4 | 经营承接能力采集（履约/组织）| ✅ | OperatingCapacity 已落地，弱信号→可采集事实 |
| 5 | 工作台 + 五器官健康观察 | ✅ | 只读总览 + 首缺提示 + 五器官信号（含缺口/风险方向）|
| 6 | 商家级权限隔离 | ✅ | operator 仅自有 / admin 全见；页面 404 / action 拒绝 |
| 7 | 回归保护（smoke）| ✅ | 30/30 一条命令可复现；测试数据自动清理 |
| 8 | 接入 SOP / 证据纪律 | ✅(文档) ⚠️(执行) | Playbook V1 完备；**但纪律靠人执行，尚未在真实场景检验** |
| 9 | 增长验证（MVS / 归因 / ROI）| ⛔(本阶段不需) | 未实现；试点**接入期不需要**，但放量/收费前需要 |
| 10 | 多用户 / 角色分配 | ⚠️ | 现仅单 operator 账号；多人协作需人工分配 admin/operator |
| 11 | 内容/素材落地 | ⚠️ | 仅摘要级，**无文件上传**；真实素材需线下/外部承载 |
| 12 | 真实数据验证 | ⛔(待跑) | 全部为夹具数据；**尚无真实商家跑通**——这正是试点要验证的 |

**读法**：1–7 全绿（最小可行接入系统已就位且实测健康）；8/10/11 为"有条件"；9/12 为"本阶段不依赖 / 待试点本身去验证"。

---

## 6. 已知缺口与风险（Open Gaps）

| 缺口 | 影响 | 缓解（试点期）|
|---|---|---|
| **尚无真实商家跑通** | 接入流程/证据纪律未经真实检验 | 试点本身即验证；先接 **1 家**、小范围 |
| **MVS 未实现** | 放量后无法自动归因/算 ROI | 接入期不需要；**放量/收费前**人工补归因口径 + 后续建 MVS |
| **单 operator 账号** | 多人协作时可见性/职责不清 | 多人前人工分配角色（admin 全见 / operator 自有）|
| **无文件上传** | 素材只能摘要记录 | 真实素材走线下/外部链接，摘要进系统 |
| **OHC 仅观察、非强制门** | 五器官 attention 不会自动拦截 | 用 Playbook 第 12/13 章人工把关"何时不引流" |
| **证据纪律依赖人** | 录入可能编造/美化 | 项目负责人抽查来源标注；缺口必须显式标 |

> 以上**均不阻断"接入期试点"**——它们影响的是"放大流量 / 收费 / 进 MVS"等更后面的人工决策点。

---

## 7. 门禁决议（Gate Decision）

### 🟡 Conditional Go（有条件放行）

**判断**：TOT 已具备启动**首个真实商家试点（接入期）**的最小技术与流程条件——最小可行接入系统**完整且实测健康（smoke 30/30）**，接入 SOP 已成文。但因**尚无真实数据验证、MVS 未建、单 operator、素材仅摘要**，不给"完全 Go"，也不必"Hold"。

**为什么不是 Go**：核心闭环从未在真实商家上跑过；放量/收费/归因能力（MVS）尚缺。
**为什么不是 Hold**：接入所需的系统能力（创建→画像→基线→承接能力→诊断→TB 链→工作台→权限）已全部到位且绿灯；继续等待不再产生信息，**只有真实接入才能产生下一步所需的证据**。

### 放行条件（Conditional · 须同时满足）

1. **人工授权**：由项目负责人/管理层**指名批准**具体试点商家（Human Commercial Authority）。
2. **范围最小**：**只接 1 家**、低风险、内部 operator 主导、不对外承诺增长。
3. **遵循 SOP + 证据纪律**：按 [Intake Playbook V1](./pilot-merchant-intake-playbook-v1.md) 执行；标来源、标缺口、不编造（[证据宪法](./evidence-framework-specification-v1.md)）。
4. **基线 + 归因先行**：尽早采 Baseline 并**初步确定归因方式**（为后续 MVS 留口径）。
5. **承接达标再引流**：在五器官摘要**没有未处理的高风险缺口**（尤其履约/现金流/组织）之前，**不放大流量**（Playbook 第 13 章）。
6. **MVS 后置**：待真实 Baseline + 执行结果产生后，再由人决定是否进 MVS。
7. **多人则先分角色**：若超过一名操作者，先人工分配 admin/operator。

### 本门禁**不**授权（Out of Scope · 需另行人工决策）

- ⛔ 放大流量 / 规模化投流　⛔ 收费 / 资源大投入　⛔ 进入 MVS/ROI 自动化
- ⛔ 多租户 / 对外平台化　⛔ 文件上传 / AI / 自动诊断　⛔ 同时铺多家

---

## 8. 建议的最小试点动线（供人参考，非决策）

1. 人工选定并批准 1 家试点商家 →
2. 按 Playbook 第 4–7 章：创建 Merchant → Profile → Baseline → Operating Capacity →
3. 第 8–9 章：TB-001 诊断 → TB-002~006（至少 draft）→
4. 工作台五器官 + 就绪清单（第 11/12 章）人工核对缺口 →
5. **人工决策点**：是否进入执行 / 是否需先补能力（第 13/15 章）→
6. 产生真实结果后 → 适时 TB-007 复盘 → 人工决定是否进 MVS。

---

## 9. 结论（Conclusions）

1. **最小可行接入系统已就位且实测健康**：smoke 30/30、权限隔离、工作台 + 五器官 + 经营承接能力齐备。
2. **接入 SOP（Playbook V1）已成文**，证据纪律与人类决策点清晰。
3. **门禁建议 = Conditional Go**：可启动**1 家、接入期、内部主导**的真实试点，须满足第 7 章条件。
4. **未就绪/不依赖项**集中在"放量之后"：MVS、归因/ROI、多租户、文件上传、AI——**接入期都不需要**。
5. **最大未知 = 真实数据从未跑过**；这恰恰**只能靠真实接入来消除**——这就是试点的意义。
6. **门禁不授权任何商业动作**：接哪家、何时开、是否放量/收费/进 MVS，全部是人工决策点；系统只提供依据。

> **成功标准自检**：本门禁完成了只读检查 + `smoke:p2` 实测，给出了分维就绪评估与 **Conditional Go** 建议，明确了放行条件、不授权范围与人类决策点，**未改动任何代码 / schema / migration / 真实数据**。

> 本文为只读评估文档；按 CHANGE_POLICY 属"新增文档（低风险）"。系统只评估、不拍板，关键决策与放行均在人工。
