# P2 Chain Review & Refactor Check — v1

> TASK-038（2026-06-03）。**只读审计**，未改动任何代码 / schema / migration / 页面 / Server Action / 数据库 / 测试数据。
> 审计对象：P2-001 ~ P2-011（商家根实体 + 8 个 TB 模板节点 + 画像 + 基准）已落地的商家业务链路。
> 对应提交：`da96b7d`（P2-011 完成时）。本报告随附 docs 提交。

---

## 1. Executive Summary（执行摘要）

**P2 主链健康、功能完整、可继续开发。** 11 个增量切片（P2-001~011）以**高度一致的模式**实现：商家根实体 `Merchant` + 10 个 1-1 资产模型（画像 / 基准 / TB-001~008），每个节点可创建/更新、显示上游只读上下文、软引用上游、详情页展示摘要、记录 createdBy/updatedBy、受登录守卫。本地手工验证全部通过，build/lint/migrate-status 全绿，迁移历史线性纯增量（13 个）。

**没有阻断正确性的问题。** 但存在三类已知"技术债"，按严重度排序：

1. **🔴 权限债（最大）**：当前仍是"登录即可访问"——任何登录用户可读/写任意商家的任意节点。`ownerProfileId` 存在但从未强制；6 角色从未用于鉴权。这是进入"多用户 / 真实试点 / 商家门户"前的**硬性阻塞**。
2. **🟠 重复/臃肿债**：10 个 node Server Action ~80% 雷同（~700+ 行）；10 个 node 表单 ~90% 雷同（~1000 行）；详情页 **620 行**单文件堆叠 11 个区块。功能正确但维护成本随节点数线性放大。
3. **🟡 测试/数据隔离债**：仅手工验证，无自动化 smoke/单测；测试夹具「测试商家A」与未来真实数据**共用同一个线上 Supabase 库**，无重置脚本。

**核心建议**：进入新功能/MVS 之前，先做**一次范围受控、行为保持的轻量重构（抽组件 + action helper）**，紧接着**落地权限模型**；二者完成后再选择 MVS / 节点总览 / 真实试点。**不建议**现在直接堆更多 TB 深化或 MVS（会把重复债再放大一轮）。

---

## 2. Current Chain Status（当前链路状态）

| 维度 | 数量 / 状态 |
|---|---|
| Prisma 模型 | **13**（HealthCheck[P0 残留] + UserProfile + Merchant + 10 资产）|
| 枚举 | **12**（Role / UserStatus / MerchantStatus + 9 个节点 status）|
| Migrations | **13**（线性、纯增量、无破坏性操作）|
| schema.prisma | 608 行 |
| 商家详情页 `[id]/page.tsx` | **620 行**（基础信息 + 10 节点区块 + 后续模块占位）|
| Server Action 文件 | 11（`createMerchant` + 10 个 upsert）|
| merchants/ 页面文件 | 24（列表 + 新建 + 详情 + 10 节点 ×（page+form））|

**链路（实际为 DAG，非纯线性）**：
```
Merchant
 ├─ MerchantProfile（画像）
 ├─ MerchantBaselineMetric（基准）
 ├─ MerchantDiagnosis (TB-001)            ← ref: profile, baseline
 ├─ MerchantAccountSetup (TB-002)         ← ref: diagnosis
 ├─ MerchantMaterialCollection (TB-003)   ← ref: accountSetup
 ├─ MerchantContentOperation (TB-004)     ← ref: materialCollection
 ├─ MerchantLivePlanning (TB-005)         ← ref: contentOperation
 ├─ MerchantLeadConversion (TB-006)       ← ref: contentOperation + livePlanning
 ├─ MerchantDataReview (TB-007)           ← ref: baseline + TB-004/005/006
 └─ MerchantNinetyDayGrowthPlan (TB-008)  ← ref: baseline + TB-001 + TB-006 + TB-007
```
> 注意：上游引用并非任务图里的"单线链"，而是**有向无环图（DAG）**——TB-006/007/008 各引用多个上游。这是按各任务规格设计的正确结果，但文档与心智模型应以"DAG"而非"linear chain"描述。

---

## 3. Schema Review

### ✅ 通过点
- **命名一致**：资产模型统一 `Merchant<Node>`；9 个节点 status 枚举统一 `<Node>Status { draft, completed, archived }`。`MerchantStatus{lead,active,paused,archived}` 与 `BaselineDataConfidence{unknown,low,medium,high}` 为领域专用值，合理。
- **1-1 关系正确**：每个资产 `merchantId @unique` + `merchant @relation(... onDelete: Cascade)`；Merchant 侧 `<asset> <Model>?` 可选反向。模型正确。
- **审计一致**：10 个资产均 `createdByProfileId` + `updatedByProfileId` → `UserProfile.id`，命名规整。
- **软引用有意为之**：`source*Id String?`（非 FK），注释清晰说明"NOT an enforced FK / 后续版本化再说"。
- **迁移健康**：13 个迁移线性、纯增量、无 reset/drop，回滚点（checkpoint tag）齐全。
- **边界注释充分**：每个模型头部都有"NOT ..."清单，明确未实现范围。
- **索引**：Merchant 有 `@@index(owner/createdBy/status)`。

### ⚠️ 风险点 / 不一致（均为轻度）
- **审计关系命名大小写不统一**：多数用短名（`BaselineCreatedBy` / `MaterialCreatedBy` / `GrowthPlanCreatedBy` / `DiagnosisCreatedBy`…），唯独 `MerchantProfile` 用全名（`MerchantProfileCreatedBy`）。纯命名风格不一致，**无功能影响**。
- **Merchant 审计与资产不对称**：Merchant 用 `owner + createdBy`（无 `updatedBy`）；资产用 `createdBy + updatedBy`（无 owner）。两套审计语义。轻度。
- **资产缺索引**：`source*Id` / `createdByProfileId` / `updatedByProfileId` 均无 `@@index`。当前规模无碍；未来出现"按创建人/按来源查询"时需补。
- **软引用无完整性 / 无版本**：`source*Id` 为"保存时刻的上游 id 快照"。因上游为 1-1 且无删除 UI，id 稳定→实践中不悬空；但 onDelete Cascade 只覆盖 merchant→asset，若未来给上游资产加删除入口，下游 `source*Id` 会悬空。低-中风险。
- **HealthCheck** P0 残留模型仍在（无害，未来可清）。

### 是否建议近期重构 Schema
**否。** Schema 本身健康，无需近期重构。可选的"以后做"：清理 HealthCheck、统一审计关系命名、按查询模式补索引。**唯一需要警惕**的是：10 个资产模型结构 90% 同构（id/merchantId/status/摘要串/source/audit），若节点/版本继续增加，应考虑更通用的资产建模或代码生成——但**现在不做**。

---

## 4. Data Flow Review

| 检查项 | 结论 |
|---|---|
| 每个节点能承接上游 | ✅ 各 node 页 `getMerchantById` 取全量上游，渲染相关上游为只读上下文 |
| `source*Id` 记录正确 | ✅ P2-004~011 每节点手工验证均 `source*_match=true`（与当前上游 id 相等）|
| 页面显示上游上下文 | ✅ 单上游（diagnosis←profile/baseline、account-setup←diagnosis…）到四上游（data-review、growth-plan）均显示 |
| 详情页显示当前节点摘要 | ✅ 10 个区块全部渲染 |
| 后续节点能读取前置 | ✅ 经 `getMerchantById` include 一次取齐 |

### ⚠️ 细节发现
- **"已引用当前X" 标签是"存在性"而非"等值性"判断**：详情页用 `source*Id ? "已引用当前X" : "未引用"`，即只判断 `source*Id` 非空，**并未**校验它 `=== 当前上游.id`。因上游 1-1 且 id 稳定→二者实际相等，但措辞"**当前**"略超出代码语义。低风险措辞问题（未来若上游可被替换/重建，需改为等值判断）。
- **过取（over-fetch）**：`getMerchantById` 一次 include 全部 10 个资产（各含 updatedBy）。该查询在**详情页**与**每个 node 创建/编辑页**都会执行（node 页只需 merchant + 1~4 上游 + 自身）。当前数据量极小，性能无碍；属"以后做"的优化点。

---

## 5. Server Action Review

**统一模式（10 个 node action）**：① `requireUser()` → ② `prisma.merchant.findUnique({where:{id}, select:{id, ...上游}})`，无则返回 `{error}` → ③ `opt()` 读字段 + status 白名单校验 → ④ 从 merchant 读上游 `source*Id` → ⑤ `prisma.<model>.upsert({where:{merchantId}, update:{...fields, updatedByProfileId}, create:{merchantId, ...fields, createdByProfileId, updatedByProfileId}})` → ⑥ `revalidatePath + redirect(详情)`。

| 检查项 | 结论 |
|---|---|
| 都用 `requireUser()` | ✅ 全部（含 `createMerchant`）|
| 都确认 Merchant 存在 | ✅ 全部 node action |
| create/update 模式一致 | ✅ 统一 `upsert`（`createMerchant` 例外：纯 create）|
| createdBy/updatedBy | ✅ create 写两者，update 只写 updatedBy |
| redirect 一致 | ✅ 全部 `revalidatePath + redirect(详情)` |
| 错误处理一致 | ✅ "商家不存在" 统一返回；**baseline 额外**有数字校验（非数字/负数→报错、不写脏数据）|
| 安全 | ✅ `merchantId` 服务端 `.bind` 绑定（不信任 client FormData）；status 白名单；`opt()` trim |

### ⚠️ 重复债（重点）
- 10 个 node action 约 **80% 雷同**，合计 ~700+ 行。差异仅三处：(a) baseline 的数字校验；(b) 读取的上游数量（0~4 个 `source*Id`）；(c) 字段名清单。**典型可抽象点**：一个泛型 `upsertMerchantAsset(merchantId, delegate, buildFields, { sources })` helper。**本任务只审计、不重构。**

---

## 6. Page / UX Review

| 检查项 | 结论 |
|---|---|
| 商家详情页是否过长 | 🟠 **620 行 / 11 区块**，全节点填好后纵向滚动很长——**最大 UX 债** |
| 节点区块是否清晰 | ✅ 统一"边框区块 + 标题 + 编辑/创建入口 + dl 摘要 或 空态"，结构一致 |
| 创建/编辑入口一致 | ✅ 每区块右上"创建X/编辑X"链接，模式统一 |
| 上游上下文显示一致 | ✅ 虚线边框只读区，统一 |
| 表单体验一致 | ✅ status 下拉 + 标注 textarea + 保存/取消，统一；baseline/data-review/growth-plan 多一个 period 文本框 |
| status 显示一致 | 🟡 详情页显示**原始英文枚举**（draft/completed/archived，无色彩 badge）；表单下拉显示**中英**（draft · 草稿）。详情与表单措辞略不一致 |
| 未来是否需要节点总览页 | ✅ **建议**：一个"8 节点进度总览/工作台"（每商家各节点 draft/completed/archived 一眼可见）价值高 |

---

## 7. Permission Debt Review

- **当前 = "登录即可访问"**：`requireUser()` 只校验"是否登录"，**不校验"是否有权"**。
- **owner-only 未实现**：`Merchant.ownerProfileId` 有值但从未用于鉴权。
- **6 角色权限未实现**：`role` 被读取但从不 gate；实际上所有登录用户都等同 admin。
- **`listMerchants` 无可见性过滤**：返回全部商家（`data.ts` 注释 TODO）。
- **每个 action + 每个 page 都带权限 TODO 注释**。

**当前可接受范围**：单运营者 / 内部可信 / 演示与试验阶段。
**何时必须偿还（硬性阻塞）**：
1. 引入**多个不同角色的内部用户**（collector/operator/executor 权限边界）；
2. 任何 **merchant 角色用户**访问自己的数据（商家门户）；
3. 真实**多商家试点**（数据隔离要紧）；
4. **开放注册**之前。

> 结论：**这是当前最大的功能性债，且是"真实试点 / 商家门户"的前置条件。**

---

## 8. Testing / Verification Review

- **现状**：每节点**手工浏览器验证**（创建→详情→编辑→DB 断言→未登录 307）+ build/lint/migrate-status + 临时 node 脚本做 DB 断言。**无自动化测试**（无 unit/integration/e2e/smoke）。
- **覆盖**：11 个切片均有手工验证记录（PROJECT_STATE + 各任务报告）。
- **风险**：共享模式（DAL / action 模板）若被改动，回归**不会被自动捕获**；节点越多，手工全量复验越不现实。
- **测试商家**：「测试商家A」适合保留为夹具；但它在**线上生产 Supabase 库**里，且**无重置脚本**——真实商家上线后会出现测试/真实数据混杂。
- **建议**：
  - 加一个轻量 **smoke 脚本**（复用线上验证用的 `@supabase/ssr` cookie + fetch 思路，或 Playwright）：登录→走链→断言；
  - 至少补 **Prisma 层集成测试**覆盖 upsert + source 关联逻辑；
  - 约定**测试数据命名/重置脚本**；中期考虑**独立测试库/ schema**。

---

## 9. Refactor Candidates（识别，不执行；附优先级）

| 候选 | 说明 | 优先级 |
|---|---|---|
| **节点表单组件** | 10 个表单 ~90% 雷同（status 下拉 + 字段 map + 错误 + 保存/取消 + 绑定 action），~1000 行 | **下一阶段前做** |
| **详情页节点区块组件** | 10 个区块内联在 620 行单文件，结构同构 | **下一阶段前做** |
| **Server Action helper** | 泛型 `upsertMerchantAsset(...)`，参数化校验/上游/字段 | **下一阶段前做** |
| 上游上下文展示组件 | node 页只读上游 dl，重复 | 可以以后做 |
| status badge 组件 | draft/completed/archived → 统一彩色 badge + 中英标签 | 可以以后做 |
| 审计元信息展示 | "更新时间/更新人" 重复 | 可以以后做 |
| `getMerchantById` 轻量变体 | 避免每页 11-join 过取 | 可以以后做 |

**现在必须做**：**无**。所有重构均为质量/可维护性，不影响正确性。

---

## 10. Risks（进入下一阶段前的主要风险）

| 风险 | 等级 | 说明 |
|---|---|---|
| **权限** | 🔴 高 | 无任何鉴权；阻塞多用户/试点/门户/开放注册 |
| **页面臃肿** | 🟠 中-高 | 详情页 620 行 + 表单 ~1000 行，随节点线性恶化 |
| **schema 膨胀** | 🟠 中 | 608 行，10 个资产 90% 同构；继续加节点/版本会放大 |
| **测试数据隔离** | 🟠 中 | 夹具在线上生产库、无重置脚本，真实数据上线后混杂 |
| **迁移/部署流程** | 🟠 中 | 迁移直接打到**唯一的生产 Supabase**，无 staging；无 CI（build/lint 仅本地跑，靠纪律）；Vercel 每次 push 自动部署 |
| **软引用** | 🟡 低-中 | 无 FK 完整性；"已引用当前"为存在性判断；上游若可删会悬空 |
| **数据一致性** | 🟡 低 | 单 upsert（1-1），无需事务；createMerchant 用当前 profile 兼任 owner+creator |

---

## 11. Recommended Next Steps（下一步建议，带推荐优先级）

> 选项：A 轻量重构 · B 权限模型 · C TB 节点深化 · D MVS/Metric · E 节点总览/工作台 · F 真实商家试点录入。

**推荐顺序：A → B →（D 或 E，按业务定）；F 必须在 B 之后。**

1. **【第一步 · 强烈建议】A — 轻量、行为保持的重构**
   - 抽出：节点表单组件、详情页节点区块组件、`upsertMerchantAsset` action helper（+ status badge）。
   - 理由：10× 重复**已经形成**，任何后续节点/功能都会**再乘一倍**成本；现在模式高度统一→重构**便宜、低风险**，且有现成手工验证作回归基准。**在加更多功能/MVS 之前做最划算。**
   - 约束：纯结构重构，不改行为/不改 schema/不改 DB；逐组件迁移 + 复跑手工验证。

2. **【第二步 · 真实试点前必做】B — 权限/角色模型**
   - 落地 `ownerProfileId` 强制 + 6 角色矩阵，替换各 action/page 的权限 TODO；`listMerchants` 加可见性过滤。
   - 放在 A 之后→权限逻辑写进**已抽出的 helper/守卫**里，一处生效。
   - 这是"多用户 / 商家门户 / 真实多商家试点 / 开放注册"的**前置条件**。

3. **【其后 · 二选一，按业务】**
   - **E — 节点总览/商家工作台**：低风险、高 UX 价值，顺带消化 status badge / 区块组件；或
   - **D — MVS / Metric 阶段**：真实数据、归因、ROI、经验候选（建在已稳的链上）。

4. **F — 真实商家试点录入**：**仅在 B（权限 + 数据隔离）完成后**进行。

**不推荐现在做**：C（再堆 TB 深化）/ D（MVS）/ F（试点）**先于** A、B——会把重复债与权限债同时放大并带进真实数据。

---

## 12. Final Conclusion（最终结论）

- **P2 主链是否健康？** ✅ 是。功能完整、模式一致、迁移线性、验证通过，无正确性阻塞。
- **是否可以继续开发？** ✅ 可以，但建议**先做一次范围受控的轻量重构（A）**再加新功能。
- **是否必须先还技术债？** **权限债（B）**是"真实试点/多用户/门户"的**硬前置**，必须在那之前还；**重复债（A）**强烈建议在加更多功能前先还（非硬阻塞，但越拖越贵）。
- **下一步最应该做什么？** **A（轻量重构）→ B（权限模型）**，然后按业务选 D/E；F 必在 B 之后。
- **隐藏风险（会影响后续 MVS / Experience / 权限 / 真实试点）？**
  1. **权限完全缺位**——一旦多用户/真实商家进入，数据无隔离；
  2. **测试夹具在生产库且无重置**——真实数据上线即混杂；
  3. **软引用为"存在性快照"**——MVS/归因若依赖"引用了哪个版本的上游"，当前模型不足（需版本化）；
  4. **无 CI / 无自动化测试**——重构与后续大改缺回归网；
  5. **页面/schema 随节点线性膨胀**——不重构则维护成本持续上升。

> **本审计结论：P2 在进入下一阶段前是健康的；建议以"A 轻量重构 → B 权限模型"作为接下来两步，先把维护成本与权限隔离这两项关键债处理掉，再推进 MVS / 工作台 / 真实试点。**
