# PROJECT_STATE.md — 项目当前状态（交接棒）

> **活文档**：每个工作块结束更新。接手本项目请先读 [/CLAUDE.md](../../CLAUDE.md)，再读本文件。
> 本文件只回答："**现在进展到哪 · 下一步做什么 · 有哪些待决问题**"。规则与文档全貌见 CLAUDE.md。
> 最后更新：2026-06-03　｜　对应提交：见 `git log -1`（本文件随附提交）

---

## 一句话状态
业务架构已成体系（约 22 份架构文档，"增长运行机制"六层闭环）。**P0 地基已完整完成（TASK-022 + 024）**：项目从"文档仓库"变为**可运行 / 可构建 / 已连库 / 已上线**的系统地基。**线上部署已验证通过** —— `https://tot-dun.vercel.app/health` 返回 `{"status":"ok","db":{"status":"connected"}}`。下一步：**P1（Supabase Auth + 6 角色）**。

## 当前阶段
- **文档/架构**：业务架构体系已相当完整（Phase 0–2 + 增长运行机制六层闭环）。
- **代码**：**P0 完成（含线上验证）**。下一步 **P1**。

## 已完成（指针见 CLAUDE.md「文档地图」）
- 8 封板模板 TB-001~008 + 治理文档 + 架构地基。
- **Phase 0 业务地基**（6）：audit / knowledge / methodology / asset / evidence / intelligence。
- **集成·验证**：MGOS / MVS / AIGO / 经验库 v1+v2 / 经验应用。
- **交付·运营**：growth-delivery / pilot(R2) / commercial-operating / merchant-success。
- **增长运行机制（六层闭环）**：诊断→策略→计划→执行→监控→复盘优化，接 MVS + 经验库成飞轮。
- **工程方案**：MVP_BUILD_PLAN、P0_FOUNDATION_PLAN。
- **P0 地基（代码·TASK-022）**：`app/` 接入 **Prisma ^6** + 最小 `HealthCheck` schema（非业务表）+ Prisma 单例 `lib/db.ts` + `/health` route + `.env.example` + `postinstall: prisma generate`。本地 build/lint 通过；已连 Supabase 跑通首个 migration（`HealthCheck` 表）；端到端 `SELECT 1` = OK。
- **P0 线上部署验证（TASK-024）**：✅ Vercel 部署成功并验证。生产域名 **`tot-dun.vercel.app`**，`/health` 返回 `db:connected`。**关键修复**：Vercel 项目 **Root Directory 必须设为 `app`**（monorepo），否则构建空壳、全路由 404。
- **基础设施**：仓库上线；自动推送 hook（docs/ 改动每轮自动 commit+tag+push）；内置记忆（CLAUDE.md + auto-memory + auto-dream）；CLAUDE.md 接续入口 + 本交接棒。

## 进行中 / 下一步
- ✅ **P0 全部完成**（本地 + 线上验证）。
- **下一步：P1 — Supabase Auth + 6 角色 + 路由守卫**（见 [MVP_BUILD_PLAN.md](./MVP_BUILD_PLAN.md)）。需用户提供 P1 所需：`NEXT_PUBLIC_SUPABASE_URL`（`https://exufxqskcsvgtohbewcu.supabase.co`）、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`。

## 待决 / 待用户提供
- **P1 所需**：上面三个 Supabase Auth 变量（anon key 可公开；service_role key 绝不入库/不暴露浏览器）。
- **Vercel 现状**：生产项目对应域名 `tot-dun.vercel.app`（团队 `jingang-admin`）；之前误建的旧项目（`tot`/`tot-livid`、`tot-j46g` 等）若仍在，建议删掉避免同仓库重复部署。线上环境变量（`DATABASE_URL`/`DIRECT_URL`）已配且生效。
- **安全**：之前暴露过的 GitHub PAT + Vercel Token（`vck_…`）请**尽快 revoke**（若未做）。

## 接续要点（换窗口/换机/换 AI）
- 仓库：`github.com/otcweb3admin-art/TOT`（monorepo：`docs/` + `app/`）。**Vercel 部署 Root Directory 必须 = `app`**。
- 线上：`https://tot-dun.vercel.app`（`/health` 看健康+DB 状态）。
- 推送凭证：本机 `lianggang405-bit`（write 协作者）缓存凭证；换机需重配凭证 + 个人 hook（hook/settings.local.json 已 gitignore）。
- 代码地基：`cd app && npm install && npm run dev`（postinstall 自动 `prisma generate`）；DB 连接串在本机 `app/.env`（gitignored）。
- 完整接续本对话：同机用 `/resume`；否则靠仓库 + CLAUDE.md + 本文件。

---
> 更新纪律：完成一个工作块后，更新"一句话状态/当前阶段/下一步/待决"，随 docs 自动推送上线。
