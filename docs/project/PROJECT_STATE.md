# PROJECT_STATE.md — 项目当前状态（交接棒）

> **活文档**：每个工作块结束更新。接手本项目请先读 [/CLAUDE.md](../../CLAUDE.md)，再读本文件。
> 本文件只回答："**现在进展到哪 · 下一步做什么 · 有哪些待决问题**"。规则与文档全貌见 CLAUDE.md。
> 最后更新：2026-06-03　｜　对应提交：见 `git log -1`（本文件随附提交）

---

## 一句话状态
业务架构已成体系（约 22 份架构文档，"增长运行机制"六层闭环）。**P0 地基已落地并连通数据库（TASK-022）**：项目从"文档仓库"变为**可运行 / 可构建 / 可部署 / 已连库**的系统地基（Next 16 + Prisma + 最小 schema + `/health`）。**已连 Supabase 并跑通首个 migration（`HealthCheck` 表已建，端到端 `SELECT 1` 验证 OK）。剩下：连 Vercel 部署上线。**

## 当前阶段
- **文档/架构**：业务架构体系已相当完整（Phase 0–2 + 增长运行机制六层闭环）。
- **代码**：**P0 地基已落地 + 已连库**——`npm install/dev/build` 通过、Prisma 配好、**已连 Supabase 并应用首个 migration（`HealthCheck` 表）**、端到端连库验证 OK（`@prisma/client` 走池化串 `SELECT 1` 成功）。下一步：**Vercel 部署** →（之后 P1 认证+角色）。

## 已完成（指针见 CLAUDE.md「文档地图」）
- 8 封板模板 TB-001~008 + 治理文档 + 架构地基。
- **Phase 0 业务地基**（6）：audit / knowledge / methodology / asset / evidence / intelligence。
- **集成·验证**：MGOS / MVS / AIGO / 经验库 v1+v2 / 经验应用。
- **交付·运营**：growth-delivery / pilot(R2) / commercial-operating / merchant-success。
- **增长运行机制（六层闭环）**：诊断→策略→计划→执行→监控→复盘优化（growth-diagnostic / -strategy / -planning / -execution / -monitoring / -review-optimization），接 MVS + 经验库成飞轮。
- **工程方案**：MVP_BUILD_PLAN、P0_FOUNDATION_PLAN。
- **P0 地基落地（代码·TASK-022）**：`app/` 接入 **Prisma ^6**（钉 6.x，经典 `prisma-client-js`，理由：build 可靠，Prisma 7 客户端模型变动大、无内置文档可对照，后续可升级）+ 最小 `HealthCheck` schema（**非业务表**）+ Prisma 单例 `lib/db.ts` + `/health` 健康检查 route + `.env.example` + `postinstall: prisma generate`。`npm run build`/`lint` 通过、`/health` 返 200（无 DB 时 `db:unconfigured`）。**未建任何业务表**（按 P0 极简，业务模型留后续 Phase）。
- **基础设施**：仓库上线；自动推送 hook（docs/ 改动每轮自动 commit+tag+push）；内置记忆（CLAUDE.md + auto-memory + auto-dream）；CLAUDE.md 接续入口 + 本交接棒。

## 进行中 / 下一步
- **P0 收尾（待用户提供连接信息）**：填 `app/.env.local`（已 gitignore）后跑 `npx prisma migrate dev`（首个 migration 建 `HealthCheck` 表，验证连库）→ 连 Vercel（Root=`app`，配同名环境变量）部署 → 线上 `/health` 验证。
- **之后 P1**：Supabase Auth + 6 角色 + 路由守卫（见 [MVP_BUILD_PLAN.md](./MVP_BUILD_PLAN.md)）。

## 待决 / 待用户提供
- ✅ **P0 连库已完成**：Supabase 连接串已在本机 `app/.env`（gitignored），迁移已应用，端到端验证通过。Supabase 项目 ref `exufxqskcsvgtohbewcu`、区域 `ap-northeast-2`。
- **P0 收尾（待用户）— Vercel 部署**：项目是否已连仓库 / 设 Root=`app` / 在 **Vercel 后台**配 `DATABASE_URL`+`DIRECT_URL`（同 `app/.env` 的值，**不要提交到仓库**）。配好后推送即自动部署，线上 `/health` 应返回 `db:connected`。
  - 注：本地 `next start` 不自动读 `.env`（Next 行为），但 Vercel 用平台环境变量，不受影响；本地开发用 `next dev` 会读 `.env`。
- 之前聊天中暴露过的 GitHub PAT：建议尽快 revoke（若未做）。

## 接续要点（换窗口/换机/换 AI）
- 仓库：`github.com/otcweb3admin-art/TOT`（monorepo：`docs/` + `app/`；Vercel 部署 Root=`app`）。
- 推送凭证：本机 `lianggang405-bit`（write 协作者）缓存凭证；**换机需重配凭证 + 个人 hook**（hook/settings.local.json 已 gitignore，不随仓库走）。
- 代码地基：`cd app && npm install && npm run dev`（postinstall 自动 `prisma generate`）；`/health` 看状态。
- 完整接续本对话：在同机 Claude Code 用 `/resume`；否则靠仓库 + CLAUDE.md + 本文件。

---
> 更新纪律：完成一个工作块后，更新"一句话状态/当前阶段/下一步/待决"，随 docs 自动推送上线。
