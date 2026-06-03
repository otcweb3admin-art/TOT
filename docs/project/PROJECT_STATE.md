# PROJECT_STATE.md — 项目当前状态（交接棒）

> **活文档**：每个工作块结束更新。接手本项目请先读 [/CLAUDE.md](../../CLAUDE.md)，再读本文件。
> 本文件只回答："**现在进展到哪 · 下一步做什么 · 有哪些待决问题**"。规则与文档全貌见 CLAUDE.md。
> 最后更新：2026-06-03　｜　对应提交：见 `git log -1`（本文件随附提交）

---

## 一句话状态
业务架构已成体系（约 22 份）。**P0 地基完成并上线**（`tot-dun.vercel.app/health` → `db:connected`）。**P1 身份与角色地基已实现，且本地登录端到端验证通过**（2026-06-03 浏览器实跑 `login→dashboard→logout→守卫` 全绿；anon key 用新版 `sb_publishable_` 格式，`supabase-js`/`@supabase/ssr` 均兼容）。**线上登录亦端到端验证通过**（2026-06-03，TASK-026：线上 `/dashboard` 带 session 返回 200 并显示 email/role/status）。**P2-001 Merchant Intake Foundation 完成**（TASK-027）+ **P2-002 Merchant Profile Asset Foundation 完成**（2026-06-03，TASK-028：第一类商家资产 `MerchantProfile`，1-1 摘要级画像，创建/查看/更新闭环，本地手工 10 项全绿）。**P2-003 Merchant Baseline Metric Foundation 完成**（2026-06-03，TASK-029：第一块增长验证基线 `MerchantBaselineMetric`，含数字字段校验，本地手工 11 项全绿）。**P2-004 TB-001 Minimal Intake Foundation 完成**（2026-06-03，TASK-030：TB-001 最小人工诊断 `MerchantDiagnosis`，1-1、可引用当前画像+基准作上游输入、创建/更新闭环）。**P2-005 TB-002 Account Setup Foundation 完成**（2026-06-03，TASK-031：第二个模板节点资产 `MerchantAccountSetup`，1-1、可引用当前 TB-001 诊断、创建/更新闭环，本地手工 12 项全绿）。**P2-006 TB-003 Material Collection Foundation 完成**（2026-06-03，TASK-032：第三个模板节点资产 `MerchantMaterialCollection`，1-1、可引用当前 TB-002 账号搭建、创建/更新闭环，本地手工 12 项全绿）。**P2-007 TB-004 Content Operation Foundation 完成**（2026-06-03，TASK-033：第四个模板节点资产 `MerchantContentOperation`，1-1、可引用当前 TB-003 素材采集、创建/更新闭环，本地手工 12 项全绿）。下一步：P2-008（如 TB-005 直播规划 / 其它模板节点）。

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
- **TASK-025 收尾完成 ✅**（2026-06-03）：`npm run build` ✓ / `npm run lint` ✓ / 密钥审计干净（`app/.env` 未入库，仅 `.env.example` 占位；`settings.local.json`【含 Vercel token】已被 gitignore）。P1 代码 commit **`4cf8e88`**（`feat: implement p1 auth role foundation`，已推送）；里程碑 tag **`checkpoint-p1-auth-final`**（回滚还原点）。
- **P1 Online Auth Verification completed ✅**（2026-06-03，TASK-026）：用户已配 Vercel `NEXT_PUBLIC_SUPABASE_URL`+`NEXT_PUBLIC_SUPABASE_ANON_KEY` 且已生效。验证方式（无可用浏览器 → 用 `@supabase/ssr` 同款库生成真实会话 cookie + curl 打线上）：`/health`=connected、`/login`=200、**带 session 的线上 `/dashboard`=HTTP 200** 且渲染 `admin@tot.local / operator / active / P1 Auth Foundation`、未登录 `/dashboard`→307 `/login`；logout 本地实跑通过（线上同代码）。tag `checkpoint-p1-online-verified`。
- **P2-001 Merchant Intake Foundation 完成 ✅**（2026-06-03，TASK-027）：第一个业务**根实体 `Merchant`**（migration `20260603120318_p2_merchant_intake_foundation`；`MerchantStatus{lead,active,paused,archived}`；owner/createdBy → `UserProfile.id`；`@@index` on owner/createdBy/status）。
  - 页面：`/dashboard/merchants`（列表：名称/行业/城市·国家/状态/创建时间）、`/dashboard/merchants/new`（创建表单 + Server Action `createMerchant`，内置 `requireUser()` 守卫、owner=createdBy=当前 profile、status 默认 `lead`）、`/dashboard/merchants/[id]`（详情 + TB-001/诊断/策略/计划/执行/监控/复盘 占位「未开始」）；dashboard 加商家入口 + P2 阶段提示。
  - DAL 增 `profileId`（= `UserProfile.id`，区别于 Supabase auth id）。
  - **边界守住**：未放 TB-001 / Profile Asset 字段（客群画像/卖点/增长目标/投流预算/诊断评分）；**列表暂不做权限过滤**（`data.ts` 注释 TODO，待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（3 migrations, up to date）✓ / 本地手工：登录→列表→建商家→详情→DB 记录(count=1)→未登录 307。tag `checkpoint-p2-001-merchant-intake`。
  - 测试数据：Supabase 现有 1 条测试商家「测试商家A (Toronto Diner)」（验证夹具，可删）。
- **P2-002 Merchant Profile Asset Foundation 完成 ✅**（2026-06-03，TASK-028）：第一类**商家资产 `MerchantProfile`**（migration `20260603123223_p2_merchant_profile_asset_foundation`；**1-1** with Merchant，`@unique merchantId` + `onDelete: Cascade`；9 个**摘要级**字段；createdBy/updatedBy → `UserProfile.id`）。
  - 页面：`/dashboard/merchants/[id]/profile`（创建/编辑表单，`saveMerchantProfile` upsert Server Action，merchantId 服务端 bind、内置 `requireUser()` 守卫）；商家详情页加「商家画像」区块（有则显示摘要 + 更新人/时间 + 编辑入口；无则「暂无画像 + 创建」）。
  - DAL `getMerchantById` 增 include `profile`（含 updatedBy）。
  - **边界守住**：仅**摘要级**字段，**非完整 TB-001**（无完整客群/卖点矩阵、P-001 预算、诊断评分、AI 输出）；权限仍简化（登录即可编辑任意商家画像，`profile-actions.ts` 注释 TODO 待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（4 migrations, up to date）✓ / 本地手工 10 项全绿（登录→详情→创建画像→填写→保存回详情→详情显示摘要→再次编辑 growthGoal→+40%→DB `MerchantProfile`(count=1, merchantId 匹配, updated_after_create)→createdBy=updatedBy=当前 profile→未登录 307）。tag `checkpoint-p2-002-merchant-profile`。
- **P2-003 Merchant Baseline Metric Foundation 完成 ✅**（2026-06-03，TASK-029）：第一块**增长验证基线 `MerchantBaselineMetric`**（migration `20260603125448_p2_merchant_baseline_metric_foundation`；**1-1** with Merchant，`@unique`+`onDelete:Cascade`；Decimal/Int 数值字段 + `BaselineDataConfidence{unknown,low,medium,high}` 枚举；createdBy/updatedBy → `UserProfile.id`）。
  - 页面：`/dashboard/merchants/[id]/baseline`（创建/编辑表单，`saveMerchantBaselineMetric` upsert，merchantId 服务端 bind、`requireUser()` 守卫、**数字字段校验**：空→null / 非数字→报错 / 负数→拒绝，错误不写脏数据）；商家详情页加「增长前基准数据」区块。
  - **边界守住**：**非完整 MVS / Metric / KPI / ROI / 归因 / 图表**；`dataConfidence` 仅最小可信度标记（**未结构化 Evidence E1/E2/E3**）；权限仍简化（`baseline-actions.ts` 注释 TODO 待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（5 migrations, up to date）✓ / 本地手工 11 项全绿（含 item 11：非法输入 `abc`/`-5` 被拒并报错、`count` 仍 1、DB 未污染）。tag `checkpoint-p2-003-merchant-baseline`。
- **P2-004 TB-001 Minimal Intake Foundation 完成 ✅**（2026-06-03，TASK-030）：TB-001 **最小人工诊断 `MerchantDiagnosis`**（migration `20260603135056_p2_tb001_minimal_intake_foundation`；**1-1** with Merchant，`@unique`+`onDelete:Cascade`；`DiagnosisStatus{draft,completed,archived}`；摘要字段 + `sourceProfileId`/`sourceBaselineMetricId` **软引用**当前画像/基准；createdBy/updatedBy → `UserProfile.id`）。
  - 页面：`/dashboard/merchants/[id]/diagnosis`（创建/编辑，`saveMerchantDiagnosis` upsert，merchantId bind、`requireUser()` 守卫；**显示上游输入只读上下文**=画像+基准；保存时记录当前画像/基准 id 作上游引用）；详情页加「TB-001 商家诊断（最小）」区块（状态/摘要/引用画像·基准/更新人）；占位列表移除「TB-001 商家诊断」。
  - **边界守住**：**非完整 TB-001 表单 / 非 AI 诊断 / 非评分 / 非审核流 / 非自动策略 / 非 Evidence 复杂对象 / 非 MVS / 非 Experience**；权限仍简化（`diagnosis-actions.ts` 注释 TODO 待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（6 migrations, up to date）✓ / 本地手工：上游上下文显示画像+基准→创建(completed)→详情显示+引用画像/基准→更新(→archived)→DB `count=1`、`sourceProfileId/sourceBaselineMetricId` 匹配当前画像/基准、createdBy=updatedBy=当前 profile、updated_after_create→未登录 307。tag `checkpoint-p2-004-tb001-minimal`。
- **P2-005 TB-002 Account Setup Foundation 完成 ✅**（2026-06-03，TASK-031）：第二个模板节点**账号搭建资产 `MerchantAccountSetup`**（migration `20260603144206_p2_tb002_account_setup_foundation`；**1-1** with Merchant，`@unique`+`onDelete:Cascade`；`AccountSetupStatus{draft,completed,archived}`；平台/定位/命名/Bio/视觉/人设/GMaps/联系/风险 等摘要字段 + `sourceDiagnosisId` **软引用**当前 TB-001 诊断；createdBy/updatedBy → `UserProfile.id`）。
  - 页面：`/dashboard/merchants/[id]/account-setup`（创建/编辑，`saveMerchantAccountSetup` upsert，merchantId bind、`requireUser()` 守卫；**显示上游 TB-001 诊断只读上下文**；保存时记录当前 diagnosis id）；详情页加「TB-002 账号搭建（最小）」区块。
  - **边界守住**：**非完整 TB-002 Output / 非真实建号 / 非 TikTok·FB·IG·GMaps API / 非 AI / 非 Channel Asset / 非内容采集运营 / 非引流转化 / 非 MVS / 非审核流**；权限仍简化（`account-setup-actions.ts` 注释 TODO 待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（7 migrations, up to date）✓ / 本地手工 12 项全绿（上游显 TB-001 诊断→创建(completed)→详情显示+引用诊断→更新(→archived)→DB `count=1`、`sourceDiagnosisId` 匹配当前诊断、createdBy=updatedBy=当前 profile、updated_after_create→未登录 307）。tag `checkpoint-p2-005-tb002-account-setup`。
- **P2-006 TB-003 Material Collection Foundation 完成 ✅**（2026-06-03，TASK-032）：第三个模板节点**素材采集资产 `MerchantMaterialCollection`**（migration `20260603152402_p2_tb003_material_collection_foundation`；**1-1** with Merchant，`@unique`+`onDelete:Cascade`；`MaterialCollectionStatus{draft,completed,archived}`；素材分类/缺口/拍摄场景/人物/产品/信任/品牌故事/优先级/风险 等摘要字段 + `sourceAccountSetupId` **软引用**当前 TB-002 账号搭建；createdBy/updatedBy → `UserProfile.id`）。
  - 页面：`/dashboard/merchants/[id]/materials`（创建/编辑，`saveMerchantMaterialCollection` upsert，merchantId bind、`requireUser()` 守卫；**显示上游 TB-002 账号搭建只读上下文**；保存时记录当前 account setup id）；详情页加「TB-003 素材采集（最小）」区块。
  - **边界守住**：**非完整 TB-003 Output / 非文件上传 / 非素材库 / 非图片视频存储 / 非素材审核 / 非 AI 分析 / 非内容运营 / 非直播 / 非引流转化 / 非 MVS / 非第三方 API**；权限仍简化（`material-actions.ts` 注释 TODO 待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（8 migrations, up to date）✓ / 本地手工 12 项全绿（上游显 TB-002 账号搭建→创建(completed)→详情显示+引用账号搭建→更新(→archived)→DB `count=1`、`sourceAccountSetupId` 匹配当前账号搭建、createdBy=updatedBy=当前 profile、updated_after_create→未登录 307）。tag `checkpoint-p2-006-tb003-material`。
- **P2-007 TB-004 Content Operation Foundation 完成 ✅**（2026-06-03，TASK-033）：第四个模板节点**内容运营资产 `MerchantContentOperation`**（migration `20260603153629_p2_tb004_content_operation_foundation`；**1-1** with Merchant，`@unique`+`onDelete:Cascade`；`ContentOperationStatus{draft,completed,archived}`；内容定位/栏目/比例/发布频率/风格/禁区/前30天计划/风险 等摘要字段 + `sourceMaterialCollectionId` **软引用**当前 TB-003 素材采集；createdBy/updatedBy → `UserProfile.id`）。
  - 页面：`/dashboard/merchants/[id]/content-operation`（创建/编辑，`saveMerchantContentOperation` upsert，merchantId bind、`requireUser()` 守卫；**显示上游 TB-003 素材采集只读上下文**；保存时记录当前 material collection id）；详情页加「TB-004 内容运营（最小）」区块。
  - **边界守住**：**非完整 TB-004 Output / 非内容发布 / 非内容日历 / 非脚本·AI 文案 / 非图文视频生产 / 非素材库 / 非平台 API / 非直播 / 非引流转化 / 非 MVS**；权限仍简化（`content-operation-actions.ts` 注释 TODO 待权限模型）。
  - 验证：build ✓ / lint ✓ / `prisma migrate status`（9 migrations, up to date）✓ / 本地手工 12 项全绿（上游显 TB-003 素材采集→创建(completed)→详情显示+引用素材采集→更新(→archived)→DB `count=1`、`sourceMaterialCollectionId` 匹配当前素材采集、createdBy=updatedBy=当前 profile、updated_after_create→未登录 307）。tag `checkpoint-p2-007-tb004-content-operation`。
- **下一步 P2-008**：按架构继续（如 TB-005 直播规划 / 其它模板节点）；仍守 AI 不拍板 / 人工审核。

## 待决 / 待用户提供
- **P1 登录本地 + 线上均已验证 ✅**（TASK-025/026）。Vercel 已配 `NEXT_PUBLIC_SUPABASE_URL`+`NEXT_PUBLIC_SUPABASE_ANON_KEY`（service_role 未用、未配）。
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
