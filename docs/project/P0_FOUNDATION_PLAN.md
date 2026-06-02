# P0_FOUNDATION_PLAN.md — P0 地基与部署管线·细化方案（待确认）

> 状态：**草案 / 待用户确认（只调研、未写代码）**　｜　日期：2026-06-02
> 上承：[MVP_BUILD_PLAN.md](./MVP_BUILD_PLAN.md) 第 6 节 P0
> 目标：打通 `repo → Supabase → Vercel`，让线上跑起一个能连数据库的空壳；定下数据库 schema 初版与环境变量规范。

---

## 0. P0 目标与验收

**目标**：地基就位——线上可访问 + 后端连通 Supabase + Prisma 迁移成功。**本阶段不做业务功能**（登录、表单、状态机都留到 P1+）。

**验收点**：
- [ ] Vercel 上线一个空壳页（含一个 `/health` 健康检查，能读到 DB 连接成功）
- [ ] Prisma `migrate` 在 Supabase 上成功建出 5 张表
- [ ] 本地 `npm run dev` 与线上环境变量都配置正确、不泄露密钥
- [ ] 推送到 `main` 触发 Vercel 自动部署成功

---

## 1. Next.js 16 关键调研结论（影响后续所有写法）

> 来自 `app/node_modules/next/dist/docs/` 实读，纠正"训练数据里的旧 Next"。

| 主题 | 结论 | 对本项目的影响 |
|------|------|---------------|
| 数据变更 | 用 **Server Actions**（`'use server'` 异步函数），走 POST | 状态流转/审批/录入都用 Server Action 实现（P2+）|
| 鉴权位置 | Server Action 可被**直接 POST 调用**，**必须在每个 action 内部校验登录与权限** | 授权逻辑封装成 `requireRole()` 之类，每个 action 首行调用 |
| 缓存模型 | Next 16 有可选 **Cache Components**（`cacheComponents: true`）；不启用则用旧模型 | **P0/MVP 不启用**——内部工具按用户实时取数，保持动态渲染最简单 |
| 数据刷新 | 变更后用 `refresh()`（`next/cache`）/ `revalidatePath` / `redirect`（`next/navigation`）| 流转后刷新工单视图 |
| 环境变量 | `.env*` 自动注入 `process.env`；浏览器可见需 `NEXT_PUBLIC_` 前缀（构建期内联）；Next 只从 **app 根目录**读 `.env` | 密钥类**不要**加 `NEXT_PUBLIC_`；Supabase anon key 可公开、service_role key 绝不公开 |
| 部署 | Vercel 为官方验证适配器；`build`/`start` 脚本已就绪 | monorepo 需在 Vercel 设 **Root Directory = `app`** |
| 其他 | 存在 `unstable_instant`、PPR 等新特性 | P0 用不到，记录备查 |

---

## 2. 技术栈与依赖清单（P0 要新增安装）

当前 `app/package.json` 已有：`next@16.2.6`、`react@19.2.4`、`tailwindcss@4`、`typescript@5`。

**P0 需新增**：
| 包 | 用途 |
|----|------|
| `prisma`（dev）+ `@prisma/client` | ORM、schema、迁移 |
| `@supabase/supabase-js` | 连接 Supabase（DB / 后续 Auth）|
| `@supabase/ssr` | Next App Router 的 cookie 会话（P1 用，P0 可一并装）|

> Anthropic SDK 留到 P3 再装，P0 不引入。

---

## 3. 数据库连接（Supabase + Prisma + Vercel serverless）

Vercel 是 serverless，必须用**连接池**，否则会耗尽 Postgres 连接。Supabase 提供两套连接串：

| 变量 | 用途 | Supabase 来源 | 端口/模式 |
|------|------|--------------|----------|
| `DATABASE_URL` | 运行时查询（经池化）| Connection Pooling（Transaction）| 6543，需带 `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Prisma 迁移（直连）| Direct connection | 5432 |

Prisma schema 里：
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
并用**单例 PrismaClient**（避免 serverless 热重载重复实例化）。

---

## 4. Prisma Schema 初版（5 张表·草案，待确认）

> 设计原则（呼应 MVP_BUILD_PLAN）：**宽而浅**——模板的上百字段统一塞进 `Node.formData`(JSON)，不硬编码成列。

```prisma
// ===== 枚举 =====
enum Role { merchant collector operator executor admin }   // ai_worker 是系统角色、无登录
enum NodeState { draft submitted ai_generated reviewing approved rejected completed }
enum HandlerType { ai human outsource }
enum ApprovalLevel { initial_review admin_final }
enum ApprovalDecision { approved rejected }

// ===== 用户与角色（关联 Supabase Auth）=====
model Profile {
  id          String   @id @default(uuid())
  authUserId  String   @unique           // = Supabase auth.users.id
  name        String
  role        Role
  createdAt   DateTime @default(now())
  merchants   Merchant[] @relation("CreatedBy")
  nodes       Node[]     @relation("Assignee")
  approvals   Approval[]
  transitions Transition[]
}

// ===== 商家工单（= 一个工单走完整 8 流程）=====
model Merchant {
  id           String   @id @default(uuid())
  name         String
  contact      String?
  currentStage Int      @default(0)       // 0=接入 … 8=90天
  createdById  String
  createdBy    Profile  @relation("CreatedBy", fields: [createdById], references: [id])
  createdAt    DateTime @default(now())
  nodes        Node[]
}

// ===== 流程节点实例（每商家 9 个：接入 + TB-001~008）=====
model Node {
  id           String      @id @default(uuid())
  merchantId   String
  merchant     Merchant    @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  templateCode String      // "intake" | "TB-001" … "TB-008"
  seq          Int         // 0..8，主流程顺序
  state        NodeState   @default(draft)
  handlerType  HandlerType?
  assigneeId   String?
  assignee     Profile?    @relation("Assignee", fields: [assigneeId], references: [id])
  formData     Json?       // 人工录入字段（通用承载）
  aiDraft      Json?       // AI 生成草稿
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  approvals    Approval[]
  transitions  Transition[]
  @@unique([merchantId, templateCode])
}

// ===== 两级审批记录 =====
model Approval {
  id         String           @id @default(uuid())
  nodeId     String
  node       Node             @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  level      ApprovalLevel    // 初审 / 终审
  reviewerId String
  reviewer   Profile          @relation(fields: [reviewerId], references: [id])
  decision   ApprovalDecision
  comment    String?
  createdAt  DateTime         @default(now())
}

// ===== 状态流转 / 操作审计 =====
model Transition {
  id        String     @id @default(uuid())
  nodeId    String
  node      Node       @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  fromState NodeState?
  toState   NodeState
  actorId   String?
  actor     Profile?   @relation(fields: [actorId], references: [id])
  action    String     // "submit" | "ai_generate" | "approve_initial" …
  createdAt DateTime   @default(now())
}
```

> ⚠️ 待你确认的设计点：① `ai_worker` 不建 Profile、AI 操作的 `actorId` 置空 + `action` 标注，可否？② 是否需要 `Merchant` 与 `WorkOrder` 拆分（当前合并，1 商家 = 1 工单，骨架够用）？

---

## 5. 环境变量清单

`app/.env.local`（本地，**不入库**，已被 `.gitignore` 覆盖）与 Vercel 项目环境变量需各配一份：

| 变量 | 示例/来源 | 是否公开 | 用在哪 |
|------|----------|---------|--------|
| `DATABASE_URL` | Supabase 池化连接串(6543)+`?pgbouncer=true&connection_limit=1` | 🔒 私密 | Prisma 运行时 |
| `DIRECT_URL` | Supabase 直连串(5432) | 🔒 私密 | Prisma 迁移 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ 可公开 | 客户端/Auth(P1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ 可公开 | 客户端/Auth(P1) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | 🔒 **绝不公开** | 服务端管理操作 |

> 我会提供一份 `.env.example`（仅占位、无真值）入库，方便对照；真值你在本地 `.env.local` 和 Vercel 后台填。

---

## 6. 部署配置（Vercel）

- **Root Directory = `app`**（monorepo 关键设置）
- Framework Preset：Next.js（自动识别）
- Build：`next build`；Install：`npm install`（会自动跑 `prisma generate`，需在 `package.json` 加 `postinstall: prisma generate`）
- 环境变量：按第 5 节在 Vercel 配齐（Production + Preview）
- 触发：推送 `main` → 自动部署

---

## 7. P0 执行步骤（确认后才执行）

1. 装依赖：`prisma`、`@prisma/client`、`@supabase/supabase-js`、`@supabase/ssr`
2. `prisma init`，写入第 4 节 schema 与 datasource
3. 加 Prisma 单例 `app/lib/db.ts`；加 `postinstall: prisma generate`
4. 写 `.env.example`（占位）；本地 `.env.local` 填真值（你给连接信息）
5. `prisma migrate dev` → 在 Supabase 建表，核验 5 张表
6. 加一个 `/health` 页或 route handler：查询一次 DB，返回连接状态
7. 连 Vercel（Root=app）、配环境变量、推送、确认线上部署 + `/health` 正常
8. 出 P0 变更摘要，验收

---

## 8. 需要你提供的连接信息（执行 P0 时）

1. Supabase：**池化连接串**（Transaction，6543）、**直连串**（5432）、项目 **URL**、**anon key**、**service_role key**
2. Vercel：项目是否已连这个 GitHub 仓库？Root Directory 是否已设 `app`？
3. 偏好：上述密钥你想（a）直接发我由我写进本地 `.env.local`（注意聊天暴露风险），还是（b）你自己填本地与 Vercel、我只写 `.env.example` 占位？**推荐 (b)**

---

## 9. 风险与未决问题

| 项 | 说明 / 处理 |
|----|------------|
| 密钥暴露 | 推荐你自己填真值；我只写占位的 `.env.example`，绝不提交真实密钥 |
| Prisma + pgbouncer | 必须用池化串 + `connection_limit=1`，迁移用 `DIRECT_URL`，否则 serverless 连接耗尽 |
| Supabase Auth vs Prisma | Auth 的 `auth` schema 由 Supabase 托管，Prisma 不管它；`Profile.authUserId` 仅存 UUID（P1 接入）|
| RLS 行级安全 | P0 不做，授权放服务端；上真实商家数据前在"细化"阶段补 |
| Cache Components | 暂不启用，保持动态渲染；如后续要静态优化再评估 |

---

## 10. 请你确认

1. **Schema 初版**（第 4 节 5 张表 + 两个待确认设计点）是否认可？
2. **环境变量与密钥提供方式**（第 8 节，推荐你自己填真值）选 (a) 还是 (b)？
3. Vercel 项目当前状态（是否已连仓库、是否已设 Root=app）？
4. 确认后即可让我开始执行 P0 第 7 节步骤。

---

## 11. 执行状态（TASK-022 落地记录，只补充状态，不改上方战略）

> 2026-06-03 执行 P0 第一步。**实际范围比第 4 节更克制**：按 TASK-022 指令"P0 不建完整业务模型"，本轮**未建第 4 节的 5 张业务表**，只建 1 个最小 `HealthCheck` 表用于验证连库与迁移。第 4 节的 5 表 schema 仍是后续 Phase 的设计基线，留待 P1+ 落地。

**已完成（已上线）**：
- 依赖：`prisma`、`@prisma/client`（**钉 ^6.19.3**；Prisma 7 客户端生成模型变动大、无内置文档可对照，P0 以 build 可靠为先，后续可升级）。
- `app/prisma/schema.prisma`：datasource（`DATABASE_URL` + `directUrl=DIRECT_URL`）+ 最小 `HealthCheck` 模型。
- `app/lib/db.ts`：Prisma 单例（serverless 安全、懒连接）。
- `app/app/health/route.ts`：`GET /health` 健康检查（`force-dynamic`），返回 `{service,status,phase,db,time}`；DB 未配时 `db:unconfigured` 且 200。
- `app/.env.example`：`DATABASE_URL`/`DIRECT_URL` 占位 + 后续 Phase 预留项（不入真值）；`app/.gitignore` 加 `!.env.example`。
- `package.json`：加 `postinstall: prisma generate`（Vercel 安装即生成 client）。
- 验证：`prisma generate` ✓、`npm run build` ✓（`/health` 为 Dynamic）、`npm run lint` ✓、本地 `/health` 实测 200。

**未完成（待用户提供连接信息）**：
- `npx prisma migrate dev`（建 `HealthCheck` 表，验证连库）——**缺 `DATABASE_URL`/`DIRECT_URL`，未编造、未硬编码**。
- Vercel 连仓库 + 环境变量 + 线上部署验证。

**未做（刻意，按 P0 极简）**：业务表（Merchant/Node/…）、Auth、Workflow、AI Agent、MVS/MGOS 实现——均留后续 Phase。
