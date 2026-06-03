# PROJECT_STATE.md — 项目当前状态（交接棒）

> **活文档**：每个工作块结束更新。接手本项目请先读 [/CLAUDE.md](../../CLAUDE.md)，再读本文件。
> 本文件只回答："**现在进展到哪 · 下一步做什么 · 有哪些待决问题**"。规则与文档全貌见 CLAUDE.md。
> 最后更新：2026-06-03　｜　对应提交：见 `git log -1`（本文件随附提交）

---

## 一句话状态
业务架构已成体系（约 22 份）。**P0 地基完成并上线**（`tot-dun.vercel.app/health` → `db:connected`）。**P1 身份与角色地基已实现，且本地登录端到端验证通过**（2026-06-03 浏览器实跑 `login→dashboard→logout→守卫` 全绿；anon key 用新版 `sb_publishable_` 格式，`supabase-js`/`@supabase/ssr` 均兼容）。下一步：**配 Vercel 两变量验证线上登录** →（之后 P2 业务模块）。

## 当前阶段
- **文档/架构**：Phase 0–2 + 增长运行机制六层闭环，已相当完整。
- **代码**：**P0 完成（含线上验证）；P1 Auth+角色地基代码完成**（migration 已应用、build/lint/守卫验证通过），**运行时登录待 Supabase Auth 配置**。

## 已完成（指针见 CLAUDE.md「文档地图」）
- 模板 TB-001~008 + 治理 + 全套业务架构（地基/集成/交付运营/增长运行机制六层）。
- **P0 地基（代码·TASK-022/024）**：Next 16 + Prisma ^6 + `HealthCheck` + `/health`；连 Supabase 跑通迁移；**Vercel 上线**（`tot-dun.vercel.app`，Root Directory=`app` 是关键）。
- **P1 Auth+角色地基（代码·TASK-025）**：
  - 依赖：`@supabase/ssr` + `@supabase/supabase-js`。
  - Supabase 工具：`lib/supabase/{config,server,client}.ts`（含 `isSupabaseConfigured()` 优雅降级）。
  - 身份层：`lib/auth/dal.ts`（`getCurrentUser`/`requireUser`，首登 JIT 建 `UserProfile`）、`lib/auth/actions.ts`（`login`/`logout` Server Actions）。
  - 路由守卫：**`app/proxy.ts`**（Next 16 把 middleware 改名 proxy；保护 `/dashboard`、已登录访问 `/login` 跳 `/dashboard`、`/health` 不保护）。
  - 页面：`/login`（邮箱密码 + 错误显示）、`/dashboard`（受保护空壳，显示 email/role/status/阶段 + 登出）。
  - 数据：migration `20260602230255_p1_auth_role_foundation` 建 `UserProfile` + `Role`(6)/`UserStatus`(2) 枚举。
  - 验证：build ✓ / lint ✓ / 守卫 ✓（未登录 `/dashboard`→307→`/login`；`/login`200；`/health`200）。
- **基础设施**：自动推送 hook、内置记忆、CLAUDE.md 接续入口、本交接棒。

## 进行中 / 下一步
- **P1 收尾 — 本地登录端到端已验证 ✅**（2026-06-03，浏览器实跑）：
  1. ✅ 测试用户 `admin@tot.local`/`TotAdmin#2026`（DB 直建：已确认 + bcrypt + email identity；测试用，随时改/删）。
  2. ✅ `app/.env` 已填 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`（新版 `sb_publishable_`）+ `SUPABASE_SERVICE_ROLE_KEY`（新版 `sb_secret_`，P1 未用）。
  3. ✅ 实跑链路：`/login` 填表单 → `POST /login 303 ƒ login()` → `/dashboard`（显示 `admin@tot.local / operator / active`）→ 登出 `POST /dashboard 303 ƒ logout()` → `/login` → 登出后访问 `/dashboard` 被守卫弹回 `/login`。DAL 首登建档 `UserProfile{operator,active}` 生效。
  - ⚠️ **DB 直建用户的坑**：GoTrue 把 `confirmation_token/recovery_token/email_change/...` 等列按"非空字符串"读取，手工插入留 `NULL` 会致 `500 Database error querying schema`；已 `COALESCE` 补空串、`email_change_confirm_status` 补 0 修复（详见 CLAUDE.md 决策）。
- **下一步：线上登录**（待用户）：把 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 配到 **Vercel → Settings → Environment Variables（Production）** 并 redeploy → `tot-dun.vercel.app/login` 同样可登。
- **之后 P2**：第一个业务模块（按架构，建议从"商家工单 + 9 节点 + TB-001 录入"的最小切片起；仍守 AI 不拍板/人工审核）。

## 待决 / 待用户提供
- **P1 本地登录已验证 ✅；线上登录待用户**：把 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 配到 **Vercel → Environment Variables（Production）** 并 redeploy → `tot-dun.vercel.app/login` 可登。
  - service_role key（新版 `sb_secret_`）：P1 未用，配不配均可；若配**仅服务端、绝不入库/不暴露浏览器**。
  - 测试账号 `admin@tot.local`/`TotAdmin#2026` 为临时夹具，上线前改密码或删除。
- **角色差异（需你定夺）**：角色枚举按 `ROLE_MODEL.md` 用 **6 个**（merchant/collector/operator/executor/admin/ai_worker）。SYSTEM_BLUEPRINT 另有 **`outsource`（第7个）**——已知文档差异（project-audit R2）。P1 **未发明、未删减**；若要纳入 outsource，后续加一个 migration 即可。
- **P1 默认角色**：新用户首登默认 `operator`（占位；P1 不做角色强制，仅"登录与否"门禁）。生产前需做**角色分配 + 限制开放注册**。
- **安全**：之前暴露过的 GitHub PAT / Vercel Token `vck_…` 请尽快 revoke（若未做）。

## 接续要点（换窗口/换机/换 AI）
- 仓库 `github.com/otcweb3admin-art/TOT`（monorepo）。**Vercel Root Directory 必须 = `app`**。线上 `https://tot-dun.vercel.app`。
- 代码：`cd app && npm install && npm run dev`。密钥在本机 `app/.env`（gitignored）。
- ⚠️ **Next 16 把 middleware 改名为 `proxy`**（`app/proxy.ts`，Node 运行时）；`cookies()` 是 async。写码前读 `app/node_modules/next/dist/docs/`。
- Prisma 在 Windows 偶发 `EPERM`（引擎 DLL 锁）——与 schema 无关，client 实际已生成，可忽略（必要时 kill node 后重试 generate）。
- 完整接续本对话：同机 `/resume`；否则靠仓库 + CLAUDE.md + 本文件。

---
> 更新纪律：完成一个工作块后，更新"一句话状态/当前阶段/下一步/待决"，随 docs 自动推送上线。
