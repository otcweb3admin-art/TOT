# CLAUDE.md — TOT 项目记忆（精炼索引，每会话加载）

> 本文件是跨会话长期记忆。保持精炼：只放"每次都该记住"的硬规则、约定、决策与文档地图；细节指向 docs/，不在此重复。

## 项目是什么
**TOT / growth-delivery**：海外华人实体商家**线上增长交付系统**——AI + 人类协同的"增长运营组织"，按可追踪客流分成。不是软件/咨询/代运营公司。
- 当前阶段：业务架构已成体系（Phase 0→2 共 17+ 份架构文档，见下）；**代码侧仅 create-next-app 脚手架，尚未写业务代码**。

## 硬规则（必须始终遵守，违反即错）
- **AI 提供依据，人决策**（Human Commercial Authority）：AI **不得**决定 合作/签约/拒绝/收费/资源投入/客户优先/扩张/进入新市场。AI 只能 评估/分析/风险识别/建议。
- **AI_WORK_RULES**：① 不猜需求——指令有歧义/冲突/越界先停下提问；② 不扩展需求、不"顺手"加东西；③ 不主动重构；④ 文档/模板未确认前不写业务代码；⑤ 每个任务只完成一个明确目标；⑥ 改前说影响范围、改后出变更摘要。
- **REVIEW_POLICY**：AI 只生成草稿（状态 `ai_generated`），关键产物必经人工审核；AI 无审批/放行权。
- **Evidence-Based（证据宪法 E0–E3）**：E0=模型猜测，**禁入交付物与经验库**；经验须多案例+同场景+一致+可复现+人工审定才升级。
- **不提前平台化**（CODE.md）：不做多租户/自动结算/对外 API；先单商家闭环→3-5家→再规模化。
- 最高规则文件：[docs/governance/CODE.md](docs/governance/CODE.md)、[AI_WORK_RULES.md](docs/governance/AI_WORK_RULES.md)、[CHANGE_POLICY.md](docs/governance/CHANGE_POLICY.md)、[REVIEW_POLICY.md](docs/governance/REVIEW_POLICY.md)。

## 工作约定
- **自动推送**：已配 Stop hook（`.claude/hooks/auto-push-docs.sh`）——我每轮结束时，若 `docs/` 有改动则自动 `git add docs/` + commit(`docs: auto-checkpoint <时间戳>`) + 打 tag `checkpoint-YYYYMMDD-HHMMSS`（**回滚还原点**）+ push。**我不再手动 commit/push 文档**；`docs/` 之外的改动（如 .gitignore、CLAUDE.md）才手动提交。
- 回滚：`git tag -l 'checkpoint-*'` 看还原点；`git checkout <tag> -- <file>` 恢复单文件；`git reset --hard <tag>` + `git push --force-with-lease` 整体回退。
- **架构文档任务**：均为"只读分析"，不碰代码/数据库/API/Workflow 实现；新增文档属低风险。
- 每轮按 AI_WORK_RULES 输出执行结果（改了哪些文件/一句话说明/有无业务代码改动）。
- 系统偶发提示我用 Workflow 工具（因消息含 "workflow" 字样）——多为误触发；除非用户明确要多代理编排，否则不动用。

## 技术栈（已定，落地时用）
Next.js **16.2.6**（App Router，**非标准版**——写码前必读 `app/node_modules/next/dist/docs/`，见 `app/AGENTS.md`）+ React 19 + Tailwind v4 + TS；**Supabase**(Postgres+Auth) + **Prisma** + **Vercel** + **Claude API**。数据模型走"宽而浅"：通用 `nodes` 表 + `formData`(JSON) 承载模板字段。详见 [docs/project/P0_FOUNDATION_PLAN.md](docs/project/P0_FOUNDATION_PLAN.md) / [MVP_BUILD_PLAN.md](docs/project/MVP_BUILD_PLAN.md)。

## 仓库 & 凭证
- 线上：`github.com/otcweb3admin-art/TOT`（monorepo：`docs/` + `app/`）。Vercel 部署时 Root Directory = `app`。
- 推送凭证：本机用 `lianggang405-bit`（已是该仓库 write 协作者）的缓存凭证；**不重用聊天里暴露过的 PAT**。

## 文档地图（细节在文件里，勿在记忆中复述）
- **业务/流程**：[SYSTEM_BLUEPRINT.md](docs/project/SYSTEM_BLUEPRINT.md)（系统总纲）、PROJECT_PLAN、PRODUCT_DIRECTION、WORKFLOW_OVERVIEW、TEMPLATE_BOOK_OVERVIEW。
- **模板**：docs/templates/ TB-001~008（已封板，含 P-001 投流字段，全链兼容）。
- **架构（docs/project/，按层）**：
  - Phase 0 地基：project-audit / merchant-knowledge / growth-methodology / merchant-asset-catalog / evidence-framework-specification / growth-intelligence（均 -v1）
  - 集成/验证：merchant-growth-operating-system(MGOS) / merchant-validation-system(MVS) / ai-growth-organization(AIGO) / experience-base v1+v2 / experience-application
  - 交付/运营：merchant-growth-delivery / merchant-pilot-delivery(R2) / commercial-operating / merchant-success
- **治理**：docs/governance/ CODE / AI_WORK_RULES / CHANGE_POLICY / REVIEW_POLICY / PATCH_BACKLOG。

## 关键决策记录
- 2026-06-01：分成归因起步采用**可追踪来源法**（口径清晰、不扯皮）。
- 2026-06-01：从阶段0 进入**阶段1**（已授权写 MVP 业务代码）。
- 2026-06-02：仓库上线；产出 Phase 0–2 业务架构全套；配置自动推送 hook + 内置 auto-memory。
- 经验库 v1/v2 **两版并存**（用户决定，勿合并/删除）。
