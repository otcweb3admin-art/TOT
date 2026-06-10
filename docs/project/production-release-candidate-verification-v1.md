# Production Release Candidate Verification V1（生产环境·上线候选版最终验收报告）

> 类型：**只读验收报告** ｜ 日期：2026-06-11 ｜ 任务：TASK-067
> 范围：**未改任何业务/UI 代码、schema、migration、权限、账号、角色、真实数据；未创建商家/交接；未调用 AI API；全程未输出任何密码 / token / cookie / service role key。**
> 验证方式：本地 lint/smoke/build + 对生产环境的真实 HTTP 验证（未登录直接请求；登录态经受控测试账号铸造会话,凭据仅存内存）。

---

## 第 1 章　Executive Summary

> **结论：🟡 Conditional Pass（有条件通过）。建议可进入首家真实商家试点（按既有 Conditional Go 条件,由负责人授权启动）。未发现任何阻塞（Blocker）或重大（Major）问题。**

- 本地 lint / smoke(54/54) / build **全绿**；生产环境**全部核心页面可用**（未登录 + 登录态共 60+ 项检查**零 FAIL**）。
- 权限边界已验证项全部通过（未登录全拦截、AI 工作台不泄露存在性、admin@tot.local 仍为 operator）。
- 评级为 Conditional 而非 Pass 的唯一原因：**多角色账号不足**（线上仅 1 个 operator 账号）,跨账号商家隔离与各角色写保护**线上**未能逐角色复验（本地已在 TASK-040/056 验证）——属任务判定标准中明示的 Conditional Pass 情形,如实报告,不伪造通过。

---

## 第 2 章　Environment

| 项 | 值 |
|---|---|
| Production URL | https://tot-dun.vercel.app（与记录一致,未发现偏差）|
| Local HEAD | `66fac67`（feat: polish ui for launch readiness）|
| Latest tag | `checkpoint-p3-ui-launch-readiness` |
| Smoke | **54/54 PASS · cleanup CLEAN** |
| Build | ✅（Compiled + TypeScript 通过）|
| Migrations | 15 · up to date |
| 验证日期 | 2026-06-11 |
| 验证账号 | 受控测试账号 `admin@tot.local`（角色 **operator**,未修改;凭据未输出）|
| 生产代码版本 | **与本地 HEAD 一致**（TASK-066 新增的「欢迎回来」「/dashboard/launch-readiness」等标记均在线上出现 → Vercel 自动部署为最新）|

---

## 第 3 章　Pre-flight Result

| 项 | 结果 |
|---|---|
| `git status` | ✅ 干净 |
| `npm run lint` | ✅ |
| `npm run smoke:p2` | ✅ 54/54 PASS |
| `npm run build` | ✅ |
| 只读确认 | admin@tot.local=**operator**（未改）· DEMO_小吃车增长样例 存在 · 商家共 2（商家A + DEMO）· 交接 0 |

---

## 第 4 章　Production Route Verification（线上路由逐项）

| 路由 | 未登录 | 登录态 |
|---|---|---|
| `/` | 200 ✅ | — |
| `/login` | 200 ✅（登录页）| — |
| `/health` | 200 ✅ **db connected** | — |
| `/dashboard` | **307 → /login** ✅ | 200 ✅ |
| `/dashboard/merchants` | 307 → /login ✅ | 200 ✅ |
| `/dashboard/merchants/intake` | 307 → /login ✅ | 200 ✅ |
| `/dashboard/ai-workbench` | 307 → /login ✅ | 200 ✅ |
| `/dashboard/handoffs` | 307 → /login ✅ | 200 ✅ |
| `/dashboard/launch-readiness` | 307 → /login ✅ | 200 ✅ |
| 商家详情（DEMO）| —（/dashboard/* 全拦）| 200 ✅ |
| 商家工作台（DEMO）| — | 200 ✅ |

无内部页泄露、无商家数据泄露、无错误堆栈外露。

---

## 第 5 章　Auth & Permission Verification

- ✅ 登录页可打开;受控会话可进入 Dashboard,正确显示 email=admin@tot.local、role=operator（运营协调）。
- ✅ 无凭据访问任何 /dashboard/* → 307 /login（等效"登出后无法访问"）。
- ✅ AI 工作台 `?merchantId=<不存在的 UUID>` → 统一提示「商家不存在或无权访问」,**不泄露存在性**。
- ✅ `admin@tot.local` 仍为 **operator**,未被误标 admin,本次验收未修改任何角色。
- ✅ UI/文档一致表述 ai_worker / merchant 不可写内部节点（写保护在 Server Action,本地 smoke 已覆盖）。
- ⚠ **受限项（如实报告）**：① 登出按钮存在于统一导航（HTML 确认）,但交互式"点击登出"未在本次生产重跑（P1 已端到端验证 登录→登出→守卫;本次以无凭据=307 验证拦截）。② **多角色权限线上验证待补充**——线上仅 1 个 operator 账号,跨账号"看不到他人商家"与 collector/executor 写保护未能在线上逐角色复验（本地 TASK-040/056 已通过同等验证）。

---

## 第 6 章　Dashboard & Navigation

- ✅ 首页：欢迎语（欢迎回来,email）· role 及业务解释 · 系统状态「真实试点前准备态」· **今日建议动作**（规则提示）· 7 类入口（接入向导/新建/列表/AI/交接/DEMO/上线检查）· 新手路径 · 不投流不放量不承诺增长提示。
- ✅ 统一导航（首页/商家管理/接入向导/交接中心/AI 工作台/上线检查 + 用户/角色 + 登出）在 **8 个页面全部出现**（含详情与工作台）。

## 第 7 章　Merchant Intake Flow

✅ `/dashboard/merchants/intake`：标题 + 准备态提醒 + 必读（先 Field Pack 采集/待补充/不编数据/不承诺增长/DEMO≠案例）+ **6 步路径齐**（创建商家→画像→基线→履约组织→TB-001 诊断→工作台查缺口）+ DEMO 学习区 + 最近商家继续录入。

## 第 8 章　DEMO & Merchant Workspace

✅ 列表：标题/新建/向导入口/DEMO 徽章/状态中文徽章（合作中/待评估）/详情与工作台入口。
✅ DEMO 详情：完整 DEMO 警告（演示数据,不得用于 MVS/ROI/真实案例）+ 打开工作台。
✅ DEMO 工作台：DEMO 警告 · **用 AI 生成草稿 + 新增交接** 主操作 · 全链节点（至 TB-008）· 状态中文（已完成）· 建议负责角色 · 可编辑/只读提示 · 下一步建议 · 五器官摘要 · 交接记录区。未保存任何数据、未创建任何交接。

## 第 9 章　AI Workbench

✅ 人工辅助模式 V0 · 边界四条（不自动调用/不自动保存/草稿/人工审核）· **7 类任务齐** · 选商家区。
✅ `?merchantId=<DEMO>&task=diagnosis`：自动选中 + DEMO 警告 + Prompt 含安全规则（不得编造数据/不得承诺增长结果）+ 缺失「待补充」+ 复制按钮 + 粘贴审核区 + 去 TB-001 节点保存链接。未调用 AI API、未保存任何输出。

## 第 10 章　Handoff Center

✅ 标题/说明 + 空状态（当前 0 条,提示在工作台创建）+ 返回入口 + **「不代表自动审批」**提示。未创建/未改/未取消任何交接。

## 第 11 章　Launch Readiness

✅ 状态「真实试点前准备态」· 实时检查（DEMO 已存在 / 可见商家数）· 人工清单（smoke/Field Pack/Outreach Kit/候选跟进表/账号角色/不承诺增长/AI 只是草稿）· Conditional Go 启动条件提醒。

## 第 12 章　Mobile / Small Screen Check

- ✅ 代码级审计 + 线上 HTML 类名确认：导航/头部/按钮区全 `flex-wrap`,卡片 `sm:/lg:` 响应式网格,商家表格 `overflow-x-auto`（min-width 触发横向滚动）,Prompt 区 `whitespace-pre-wrap`。本地开发期亦有同构页面实跑。
- ⚠ 受限项：本次未做生产环境**真机/浏览器视觉**抽查（建议正式上线后人工开手机抽看 5 个主页面）。

---

## 第 13 章　Issues Found

| 级别 | 数量 | 明细 |
|---|---|---|
| **Blocker** | 0 | — |
| **Major** | 0 | — |
| **Minor** | 0 | — |
| **Observation** | 3 | ① 多角色权限线上验证待补充（仅 1 个 operator 账号;本地已等效验证）② 生产交互式登出点击未重跑（无凭据拦截已验;P1 已 E2E）③ 小屏为代码级验证,真机视觉抽查待人工 |

---

## 第 14 章　Final Recommendation

- **可以进入首家真实商家试点**（系统侧就绪;是否启动由负责人决定,Human Commercial Authority）。
- **前提条件**（沿用 Readiness Gate Conditional Go）：负责人明确授权 · 只接 1 家 · 先 Field Pack 线下采集再录入 · 证据纪律（待补充/不编造）· 基线与归因先行 · 承接达标前不引流。
- **禁止事项**：不投流不放量 · 不承诺增长/ROI · 不把 DEMO 当案例 · AI 输出必须人工审核后才录入 · 不进入 MVS/Phase D。
- **下一步建议**：① 人工授权后按「候选跟进表→Outreach Kit→Field Pack→接入向导」接入首家真实商家;② 多人协同前按账号指南建 collector/operator/executor/admin 分角色账号并补线上多角色验证;③ 上线后真机抽查 5 个主页面小屏表现。

> 本报告为只读验收文档;按 CHANGE_POLICY 属"新增文档（低风险）"。**TOT Release Candidate 线上验收完成：Conditional Pass,具备真实试点前可用性。**
