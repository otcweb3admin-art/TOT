# MVP_BUILD_PLAN.md — MVP 骨架实施计划书（待确认）

> 状态：**草案 / 待用户确认**　｜　制定日期：2026-06-02
> 上承：[SYSTEM_BLUEPRINT.md](./SYSTEM_BLUEPRINT.md)（系统总纲）、[CODE.md](../governance/CODE.md)（最高规则）
> 目标阶段：阶段 1 — MVP 技术实现（完整 8 流程骨架 + 1 商家端到端跑通）
> 策略：**完整骨架优先（宽而浅）+ 一次到位的基础架构 + 先跑通后细化**

---

## 0. 本计划书要做什么 / 不做什么

| ✅ 本轮要做（MVP 骨架） | ❌ 本轮不做（守住边界） |
|------------------------|------------------------|
| 完整 8 流程节点 + 主流程流转 | 多租户 / SaaS / 商家自助入驻 |
| Supabase Auth 正式登录 + 6 角色权限 | 自动结算 / 分成系统 |
| 状态机（draft→…→completed）+ 两级审批 | 社交媒体自动发布 |
| AI 生成器接口 + 真接 Claude API（含降级占位） | 移动端 App |
| 1 个商家工单从接入→90天端到端跑通 | 每个模板上百字段的精细化落地（用通用 JSON 表单承载）|
| 线上部署（Supabase + Vercel）| 全自动无人工审核闭环 |

**贯穿约束（来自 CODE.md）**：文档先行；每个阶段只完成一个明确目标；改前说影响范围、改后出变更摘要；不提前平台化。

---

## 1. 技术栈与架构决策（已与用户确认）

| 维度 | 选择 | 说明 |
|------|------|------|
| 框架 | **Next.js 16.2.6**（App Router）+ React 19 + TypeScript + Tailwind v4 | ⚠️ 非标准版本——写码前**必须**先读 `app/node_modules/next/dist/docs/`（见 `app/AGENTS.md` 警告）|
| 数据库 | **Supabase Postgres** | 线上数据库已就绪 |
| ORM / 数据访问 | **Prisma**（typed schema + migrations）连 Supabase Postgres | Vercel serverless 需配连接池（Supabase pooler / `DATABASE_URL`+`DIRECT_URL`）|
| 认证 | **Supabase Auth**（邮箱密码）一次到位 | `ai_worker` 是系统角色、无登录 |
| 授权 | **服务端校验**（route handler / server action 内按角色判断）| 行级安全（RLS）留到"细化"阶段 |
| AI 生成 | **生成器接口 + Anthropic SDK 真接 Claude** | 模板「AI 生成要点」作系统提示词；无 Key 时降级占位草稿；含 prompt caching |
| 部署 | **线上仓库 + Vercel** | Supabase 跑 migration + seed |

---

## 2. 数据模型（通用化 / 宽而浅）

> 核心取舍：8 个模板每个约 8–10 个 Output、每 Output 约 10 字段（合计数百字段）。骨架阶段**不**把这些硬编码成数据库列，而是用**一张通用节点表 + JSON 表单**承载，保证"宽而浅、能跑就行"，细化阶段再按需结构化高频字段。

| 表 | 作用 | 关键字段（骨架版）|
|----|------|------------------|
| `profiles` | 用户与角色（关联 Supabase Auth user）| `id`, `auth_user_id`, `name`, `role`(merchant/collector/operator/executor/admin) |
| `merchants` | 商家工单主体（= 一个工单走完整 8 流程）| `id`, `name`, `contact`, `current_stage`, `created_by` |
| `nodes` | 流程节点实例（每商家 9 节点：接入 + TB-001~008）| `id`, `merchant_id`, `template_code`, `seq`, `state`(7态), `assignee_id`, `handler_type`(ai/human/outsource), `form_data`(JSON), `ai_draft`(JSON/text) |
| `approvals` | 两级审批记录 | `id`, `node_id`, `level`(initial_review/admin_final), `reviewer_id`, `decision`(approved/rejected), `comment` |
| `transitions` | 状态流转 / 操作审计日志 | `id`, `node_id`, `from_state`, `to_state`, `actor_id`, `action`, `created_at` |

模板（TB-001~008）的元数据（名称、字段定义、AI 要点）以**静态配置/种子数据**形式存在代码中，不必入业务表。

---

## 3. 状态机与两级审批（核心逻辑）

- **单节点状态**：`draft → submitted → ai_generated → reviewing → approved / rejected → completed`，严格按 [WORKFLOW_STATE_MODEL.md](../architecture/WORKFLOW_STATE_MODEL.md) 的允许流转表 + 角色权限表实现，**禁止非法跳跃**（如 ai_generated→completed）。
- **AI 权限**：AI 只能置 `ai_generated`，不能推进到 approved/completed、不能分派。
- **两级审批（节点间流转）**：上节点 `completed` → ①下阶段初审（接收方验收上游交付）→ ②管理员终审放行 → 下节点开始。对应模板末尾的 Workflow Gate。

---

## 4. 角色与页面（App Router）

| 路由 | 内容 | 谁能看 |
|------|------|--------|
| `/login` | Supabase Auth 登录 | 全部 |
| `/`（dashboard）| 角色化首页：admin 看全工单总览；其他角色看分派给自己的任务列表 | 按角色过滤 |
| `/merchants` `/merchants/new` | 商家工单列表 / 新建（接入）| collector/admin |
| `/merchants/[id]` | 工单详情：9 节点 + 各自状态进度条 | 相关角色 |
| `/merchants/[id]/[node]` | 节点详情：JSON 表单、AI 生成按钮、草稿展示、审核与两级审批操作 | 按状态/角色 |

权限原则（ROLE_MODEL）：每个角色**只看到与自己相关的任务**，服务端强制校验。

---

## 5. AI 生成器（接口先行）

- `app/lib/ai/generator.ts`：`generateDraft(templateCode, formData) → draft`
- 真实实现：Anthropic SDK 调 Claude，模板「AI 生成要点」作 system prompt（启用 prompt caching）；Key 来自环境变量 `ANTHROPIC_API_KEY`。
- 降级：无 Key 或调用失败 → 返回结构化占位草稿，保证流程不阻塞。
- 产物落 `nodes.ai_draft`，状态置 `ai_generated`，**必经人工审核**。

---

## 6. 实施阶段（每阶段 = 一个明确目标 + 验收点 + 变更摘要）

> 对应蓝图路线图「阶段一·搭骨架」+「阶段二·跑通」。每阶段结束我会给变更摘要，你验收后再进下一阶段。

| 阶段 | 目标 | 主要产出 | 验收点 |
|------|------|---------|--------|
| **P0 地基与部署管线** | 打通 repo→Supabase→Vercel | 连接线上仓库、Prisma schema 初版、Supabase 连接、首次部署空壳、环境变量配置 | 线上可访问 + DB 连通 + Prisma migrate 成功 |
| **P1 认证与角色** | Supabase Auth 登录 + 角色路由守卫 | 登录页、`profiles`+role、按角色过滤的空面板首页 | 不同角色登录看到不同（空）面板 |
| **P2 工单与录入** | 商家接入 + TB-001 录入 | 新建商家自动生成 9 节点、JSON 表单填写与提交 | 能录入 1 个商家、节点进入 submitted |
| **P3 状态机 + AI** | 状态流转引擎 + AI 接入 | 合法流转校验、AI 生成器接 Claude、ai_generated | 触发 AI 生成草稿、状态正确流转、非法跳跃被拦 |
| **P4 两级审批 + 全链路** | 初审 + 终审 + 节点间流转 | 两级审批操作、approved→completed→下节点 | 单节点经两级审批流转到下一节点 |
| **P5 端到端跑通 + 部署验收** | 1 商家走通 8 流程 | demo 商家接入→诊断→…→90天、线上演示 | **MVP 验收**（见下）|

---

## 7. MVP 验收标准（来自 SYSTEM_BLUEPRINT 第 9 节）

- [ ] 1 个商家能从接入 → 诊断 → … → 90天规划，完整走通一次
- [ ] 每个流程经**两级审批**才流转到下一环
- [ ] 各角色登录后**只看到自己的任务**
- [ ] AI 能基于模板生成草稿、人工能审核确认/退回
- [ ] 整条流程线上可演示、可协作

---

## 8. 需要你提供的输入（执行前/执行中）

1. **线上仓库地址**（git remote），以便连接 `app/` 并推送。
2. **Supabase**：项目 URL、anon key、service_role key、数据库连接串（`DATABASE_URL` 池化 + `DIRECT_URL`）。
3. **Vercel**：项目是否已建、是否已连仓库。
4. **Anthropic API Key**（`ANTHROPIC_API_KEY`）。
5. 预置用户清单（每个角色 1 个测试账号即可）。

> 密钥类信息请通过环境变量/`.env.local`（不入库）或你直接在 Supabase/Vercel 后台配置，我不会把密钥写进代码或提交。

---

## 9. 风险与约束

| 风险 | 应对 |
|------|------|
| Next.js 16 为非标准版本，API 可能与常识不符 | 写码前先读 `node_modules/next/dist/docs/`（AGENTS.md 强制）|
| Prisma + Vercel serverless + Supabase 连接池 | 用 Supabase pooler，配 `DATABASE_URL`(pgbouncer)+`DIRECT_URL` |
| 骨架阶段陷入精雕细琢 | 守住"能跑就行"，模板字段用通用 JSON 承载，细化留后续 |
| 提前平台化 | 不做多租户/结算/RLS 细粒度/对外 API，留到细化或后续阶段 |
| 授权仅服务端、暂无 RLS | 骨架够用；上线真实商家数据前在"细化"阶段补 RLS |

---

## 10. 确认事项（请你回复）

1. 上述**技术栈与数据模型**是否认可？（尤其 Prisma vs 直接用 Supabase client、是否用 Supabase Auth）
2. **阶段划分 P0–P5** 是否按此推进、每阶段验收后再进下一阶段？
3. 第 8 节**输入清单**你计划如何提供（现在给 / 到对应阶段再给）？
4. 是否同意：本计划书定稿后，先从 **P0 地基与部署管线**开始？
