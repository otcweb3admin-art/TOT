# AI Growth Organization Architecture V1（AIGO · AI 增长组织架构）

> 类型：**只读业务组织架构分析**　｜　日期：2026-06-02　｜　任务：AIGO（Phase 1 · AI Organization Layer）
> 范围：不含数据库 / 表结构 / API / Workflow 实现 / Agent 代码 / Prompt 实现。仅讨论**业务组织架构**。
> 本文回答：**如果把 TOT / MGOS 看成一家增长公司，AI 团队应如何组织、协作、治理与成长？——MGOS 里到底是谁在工作？**
> 上承全部 8 份架构（Audit / Knowledge / Methodology / Asset / Evidence / Intelligence / MGOS / MVS）；本文是 MGOS 的**组织层**。

---

## 序言：MGOS 需要一个"组织"，不是一个"超级 AI"

前八份文档定义了 TOT 是什么、知道什么、如何增长、凭什么说、为何越来越强、如何运行、如何验证。但有一个问题始终悬空：**这台机器里，到底是谁在干活？**

答案不是"一个万能 AI"，而是**一个分工明确、相互制衡、人类领导的 AI 增长组织（AIGO）**。本文就是这个组织的"公司章程 + 组织架构图 + 治理条例"。

---

## 第一章　AI Organization Definition（AI 组织定义）

### 1.1 为什么必须是组织，而不是一个万能 AI

增长**本质上是多个专业能力的协作**——市场、内容、平台、策略、风险、证据、验证、经验，每一项都是独立专业。一个"万能 AI"试图同时扮演所有角色，会带来四个致命问题：

| 万能 AI 的问题 | 组织化的解法 |
|---------------|-------------|
| **无制衡**：自己出方案、自己审、自己说有效 | 生产与审计**分离**（出方案的不审自己）|
| **无专精**：什么都做、什么都浅 | 专业**分工**，各司其职 |
| **无追溯**：一锅烩，错了不知错在哪 | 职责**边界清晰**，可定位 |
| **易漂移**：没有交叉检查，幻觉/越权难拦 | **多角色交叉校验**（证据审计、风险审计独立）|

> **核心论断**：增长是协作的产物，因此承载增长的 AI 必须**组织化**。AIGO 用"分工 + 制衡 + 人类领导"替代"一个全能黑箱"。

### 1.2 AIGO 的组织本质

> **AIGO = 一支由专业 AI 角色组成、按增长生产流水线协作、受证据与治理约束、由人类领导决策的"AI 增长团队"。**

它是前文反复出现的 **AI 四职能（Researcher / Analyst / Planner / Auditor）** 的**组织化落地**——把抽象的四职能，展开为一个有岗位、有协作链、有治理的增长公司 AI 团队。

---

## 第二章　AI Role Taxonomy（AI 角色体系）

完整 AI 团队 = **1 个总管 + 10 个专业角色**，每个角色归属一种基础职能：

| # | AI 角色 | 中文 | 基础职能 | 对应系统/TB |
|---|---------|------|---------|------------|
| 0 | **CGO AI** | 增长总管 | 总管（协调）| 全局 |
| 1 | **Market Research AI** | 市场研究员 | Researcher | 市场/城市/用户调研（E2）|
| 2 | **Platform Intelligence AI** | 平台规则专家 | Researcher | TikTok/FB/IG/Maps/小红书规则（E2）|
| 3 | **Growth Analyst AI** | 增长分析师 | Analyst | TB-001 诊断 |
| 4 | **Strategy Planner AI** | 增长策略师 | Planner | TB-002/006/008 策略 |
| 5 | **Content Architect AI** | 内容架构师 | Planner | TB-003/004/005 内容 |
| 6 | **Campaign Planner AI** | 活动策划师 | Planner | TB-006 引流/转化/私域 |
| 7 | **Risk Auditor AI** | 风险审计师 | Auditor | 红线/平台违规/风险 |
| 8 | **Evidence Auditor AI** | 证据审计师 | Auditor | E0–E3 评级/来源验证 |
| 9 | **Validation Analyst AI** | 验证分析师 | Analyst | MVS 归因/KPI/ROI（TB-007）|
| 10 | **Experience Curator AI** | 经验管理员 | 治理（候选标记）| 经验库（TASK-008）|

### 2.1 角色定义详述

- **CGO AI（增长总管）**：全局协调、任务分派、信息整合、把控方向与优先级。**无最终决策权**（接 AI_WORK_RULES 的 Claude 总管职能）。
- **Market Research AI（市场研究员）**：市场/行业/城市/用户调研，产出 E2 市场事实（须来源 + 时间 + 多源佐证）。
- **Platform Intelligence AI（平台规则专家）**：各平台规则、推荐机制、合规红线、本地 SEO 研究，产出 E2 平台知识（强时效，须时间戳）。
- **Growth Analyst AI（增长分析师）**：商家诊断、增长机会发现、瓶颈/漏斗漏点识别（TB-001）。
- **Strategy Planner AI（增长策略师）**：增长路径、渠道策略、获客策略、90 天路线（TB-002/006/008 策略层）。
- **Content Architect AI（内容架构师）**：内容矩阵、栏目体系、IP/人设规划（TB-003/004/005）。
- **Campaign Planner AI（活动策划师）**：引流/转化/私域/投流活动设计（TB-006，含 P-001）。
- **Risk Auditor AI（风险审计师）**：红线检查、平台违规检查、增长铁律检查（MGOS 七层防御的 L1/L2）。
- **Evidence Auditor AI（证据审计师）**：E0–E3 评级核验、来源验证、证据五要素检查（证据宪法守门）。
- **Validation Analyst AI（验证分析师）**：MVS 归因、KPI 验证、ROI 验证（TB-007）。
- **Experience Curator AI（经验管理员）**：案例审核、**标记经验升级候选**、辅助智能沉淀——**仅标候选，不自行升级**（接 Experience Base）。

> **一致性**：11 个角色全部归约到"四职能 + 总管"——AIGO 不是新发明，而是把贯穿全架构的 AI 职能**组织化**。

---

## 第三章　Responsibility Matrix（职责矩阵）

每个 AI：**能做什么 · 不能做什么 · 依赖什么证据 · 输出什么**。

| AI 角色 | 能做（✅）| 不能做（❌）| 依赖证据 | 输出 |
|---------|----------|------------|---------|------|
| **CGO AI** | 协调、分派、整合、提优先级建议 | 决策、审批、放行 | 全局信息 | 协调建议、任务编排 |
| **Market Research AI** | 采集市场/城市/用户事实 | 把孤证当事实、产 E3 | 外部来源 | E2 市场知识（带源+时间）|
| **Platform Intelligence AI** | 研究平台规则/机制 | 臆测规则、产 E3 | 平台官方 | E2 平台知识（带时间戳）|
| **Growth Analyst AI** | 诊断、找瓶颈/机会 | 替商家下结论、创造证据 | E1 商家事实 + E2 | 诊断（标 E0 假设待验证）|
| **Strategy Planner AI** | 设计增长策略（带证据+降级）| 决定走哪条路、创造证据 | E1+E2+E3 | 策略草稿（ai_generated）|
| **Content Architect AI** | 设计内容矩阵/栏目/IP | 套固定模板、脱离素材 | E1+E2+E3 | 内容方案草稿 |
| **Campaign Planner AI** | 设计引流/转化/投流活动 | 无承接硬引流、Day1 强成交 | E1+E2+E3 | 活动方案草稿 |
| **Risk Auditor AI** | 查红线/违规/铁律 | 放行（仅标记） | 红线 + 铁律 | 风险标记/拦截建议 |
| **Evidence Auditor AI** | 查证据级别/来源/五要素 | 放行、自己定结论 | 证据宪法 | 证据合规报告 |
| **Validation Analyst AI** | MVS 归因/KPI/ROI 验证 | 美化结果、用方案数据 | E1 真实数据 | 验证结论（带置信）|
| **Experience Curator AI** | 审案例、**标升级候选** | 自创经验、自行升级 | MVS 验证结果 | 经验候选（待人审定）|

> **横切铁律**：所有 AI 都 **① 不创造证据 ② 不谎报级别 ③ 不藏不确定性 ④ 不越权放行**（证据宪法四铁律）。

---

## 第四章　Authority Model（权限模型）

### 4.1 AI 的权限天花板（不可突破）

> **AI 永远没有：审批权 · 决策权 · 放行权。**
> **AI 只能：研究 · 分析 · 方案 · 审计。**
> **最终：Human Approve（人工审批）。**

```
AI 团队（研究/分析/方案/审计）
        │  产出"就绪可决"的依据
        ▼
   ┌──────────────┐
   │  Human Approve │  ← 决策/审批/放行，恒在人
   └──────────────┘
        │
        ▼
   进入执行 / 流转下一阶段
```

### 4.2 权限四象限

| 权限 | AI | 人 |
|------|----|----|
| 研究/分析/方案/审计 | ✅ | ✅ |
| **审批**（approve）| ❌ | ✅ |
| **决策**（选路径/投流/放量）| ❌ | ✅ |
| **放行**（Gate 流转）| ❌ | ✅ |

> **连总管（CGO AI）也无决策权**——它协调、不拍板。这是 REVIEW_POLICY / AI_WORK_RULES 在组织层的硬化：**AI 让判断就绪，人做决策。**

---

## 第五章　Collaboration Architecture（协作架构）

AIGO 按一条**增长生产流水线**协作，且**每段产出都过审计、过人工审批**：

```
【研究层】Market Research AI + Platform Intelligence AI   （产出 E2）
        ▼
【诊断层】Growth Analyst AI                                （TB-001 诊断）
        ▼
【策略层】Strategy Planner AI                              （增长路径/渠道）
        ▼
【方案层】Content Architect AI ∥ Campaign Planner AI       （内容/活动方案）
        ▼
【审计层】Risk Auditor AI + Evidence Auditor AI           （红线/证据交叉审）
        ▼
      Deliverable（草稿，ai_generated）
        ▼
   ★ Human Approve（两级审批）★
        ▼
      Execution（人/外包/AI 执行）
        ▼
【验证层】Validation Analyst AI                            （MVS 归因/KPI/ROI）
        ▼
【经验层】Experience Curator AI（标候选）→ ★ Human 审定 ★ → Experience Base
```

### 5.1 协作三原则

1. **生产与审计分离**：出方案的（Planner 们）≠ 审方案的（Auditor 们）——**不自己审自己**。
2. **CGO AI 编排不裁决**：总管负责把活分派、把信息串起来，但**不替任何环节做决定**。
3. **每段都有人工闸门**：Deliverable 进执行、经验进库，**都必须人工审批/审定**——AI 流水线高效，但永不自动放行。

### 5.2 与 MGOS 五段闭环的对齐

| MGOS 段 | 主责 AI 角色 |
|---------|-------------|
| Diagnosis | Growth Analyst（+ Market/Platform Research 供 E2）|
| Strategy | Strategy Planner（+ Content Architect / Campaign Planner）|
| Execution | Content Architect / Campaign Planner（生成执行草稿）|
| Validation | Validation Analyst |
| Intelligence | Experience Curator |
| 全程横切 | Risk Auditor + Evidence Auditor + CGO AI |

> AIGO 不是另起炉灶，而是**给 MGOS 五段闭环配上了"谁来干"的组织答案**。

---

## 第六章　Knowledge Access Model（知识访问模型）

谁能读/写**知识库**与**经验库**，全部受 **Evidence Framework** 约束。

| 库 | 可读 | 可写 | 约束 |
|----|------|------|------|
| **知识库（Knowledge）** | **全部 AI**（履职需要）| **Researcher 类**（Market/Platform）写 E2；**Analyst 类**写分析（标 E0 假设待验证）| 写入必带证据标签（级别+来源+时间）；**E0 不入交付物** |
| **经验库（Experience）** | Strategy / Content / Campaign / Analyst（**复用**经验）| **无 AI 直接写**；Experience Curator **仅标候选** | **写入须 MVS 验证 + 人工审定**（见第七章）|

### 6.1 访问三规则

1. **读取广、写入严**：履职可广读，但写入须带证据、须分级。
2. **经验库写入 = 人工闸门**：任何 AI 都不能直接把内容写进经验库；Curator 只能"提名"。
3. **一切访问留痕可追溯**：谁读了什么、谁提名了什么经验，可回溯（接证据宪法"可追溯"）。

---

## 第七章　Experience Governance（经验治理）

经验库的写入权限，是 AIGO 最严的一道闸：

> **未经 MVS 验证 → 禁止进入经验库。**
> **禁止 AI 自行创造经验。**
> **禁止 AI 自行升级经验等级。**

### 7.1 经验入库/升级的唯一合法路径

```
MVS 验证（高置信归因）
   ▼
Experience Curator AI 标"候选"（去标识 + 切片标签）
   ▼
★ Human 审定 ★（依据 Evidence Framework 准入 + Experience Base 升级门槛）
   ▼
进入经验库 / 升级层级（L1→L2→…）
```

### 7.2 三条禁令（对应三种污染）

| 禁令 | 防止的污染 |
|------|-----------|
| 未验证不入库 | 假成功污染（把季节增长当成功模式）|
| AI 不自创经验 | 凭空"经验"（E0 伪装成 E3）|
| AI 不自升等级 | 越级泛化（L2 餐饮当 L4 普适）|

> 经验治理 = Evidence Framework（准入）+ Growth Intelligence Architecture（升级门槛）+ Experience Base（运作机制）三者在组织层的合并执行。**Curator 提名，人审定，机制守门。**

---

## 第八章　Human-AI Operating Model（人机运营模型）

> 未来这家公司怎么运转？**人领导，AI 干活；AI 辅助经营，而非 AI 管理公司。**

| 层 | 角色 | 负责 |
|----|------|------|
| **决策层** | Human（管理员/运营/老板）| 决策、审批、客户关系、战略方向、对结果担责 |
| **生产层** | AI（AIGO 11 角色）| 研究、分析、方案、审计、复盘 |

### 8.1 人机分工的不可移动线

- **人做的事**：拍板（选路径/投流/放量/改定位）、审批放行、维护客户关系、定战略方向、承担最终责任。
- **AI 做的事**：把研究做透、把分析做准、把方案做实、把审计做严、把复盘做诚实——**让人的每一个决策都"证据充分、就绪可决"**。

### 8.2 "AI 辅助经营" vs "AI 管理公司"

| | AI 辅助经营（TOT 采用）| AI 管理公司（TOT 禁止）|
|---|----------------------|----------------------|
| 决策 | 人 | AI |
| 责任 | 人担 | 无人担（黑箱）|
| 客户关系 | 人维护 | — |
| AI 定位 | 增长团队（执行专业工作）| 老板（拍板）|

> **AIGO 是公司的"专业团队"，不是公司的"管理层"。** 人是 CEO，AI 是世界级的研究/分析/方案/审计团队。

---

## 第九章　Governance Model（治理模型）

AIGO 治理须防五大失效，且与 Evidence Framework / MVS / MGOS **保持一致**：

| 风险 | 防御机制 | 责任角色 | 一致于 |
|------|---------|---------|--------|
| **幻觉** | E0 拦截 + 证据五要素 + 默认无效 | Evidence Auditor AI | 证据宪法 |
| **越权** | Authority Model（无放行权）+ 总管不裁决 + 人工闸门 | 全体 + Human | AI_WORK_RULES |
| **经验污染** | 未验证不入库 + 不自创/不自升 + Curator 仅提名 | Experience Curator + Human | Experience Base / Intelligence |
| **证据造假** | 可追溯 + 真实数据 + 来源验证 | Evidence Auditor + Validation Analyst | 证据宪法 / MVS |
| **风险遗漏** | 红线/铁律/平台违规检查 + 七层防御 | Risk Auditor AI | MGOS |

### 9.1 治理三支柱

1. **制衡**：生产（Planner）与审计（Auditor）分离、验证（Validation Analyst）独立——**没有谁能既出方案又判自己有效**。
2. **闸门**：每个关键节点（Deliverable 放行、经验入库）都有**人工闸门**。
3. **追溯**：每条结论、每条经验、每个决策都可回溯到证据与责任人。

> **治理不是事后纠错，而是把"制衡 + 闸门 + 追溯"内建进组织结构本身。** 这是 AIGO 可以放心规模化的前提。

---

## 第十章　Architecture Conclusions（架构结论）

1. **增长是多专业协作，故 AI 必须组织化**：用"分工 + 制衡 + 人类领导"替代"一个万能黑箱"。
2. **AIGO 是四职能（Researcher/Analyst/Planner/Auditor）+ 总管的组织化落地**，11 个角色全部归约于此。
3. **生产与审计分离**：出方案的不审自己；证据审计、风险审计、验证分析独立制衡。
4. **AI 权限有硬天花板**：永无审批/决策/放行权，只能研究/分析/方案/审计——连总管也不拍板。
5. **协作是一条增长生产流水线**：研究→诊断→策略→方案→审计→[人审批]→执行→验证→[人审定]→经验，对齐 MGOS 五段闭环。
6. **知识库读取广、写入严**：写入必带证据标签，E0 不入交付物。
7. **经验库写入是最严闸门**：未经 MVS 验证禁入、AI 不自创、不自升，Curator 仅提名、人审定。
8. **人机分工不可移动**：人决策/审批/客户/战略/担责，AI 研究/分析/方案/审计/复盘。
9. **AI 辅助经营，非 AI 管理公司**：AI 是专业团队，人是 CEO。
10. **治理防五大失效**（幻觉/越权/经验污染/证据造假/风险遗漏），且与证据宪法/MVS/MGOS 一致。
11. **治理靠制衡 + 闸门 + 追溯，内建进组织结构**，而非事后补救。
12. **AIGO 让 MGOS 从"机器"变成"会运转的公司"**：前文回答"机器怎么转"，本文回答"谁在转、如何不出错"。

### 10.1 AIGO 是增长链的"AI 组织层"

> AIGO 是 **Knowledge → Evidence → Strategy → Execution → Validation → Experience** 这条增长链的**人工智能组织层**：

```
Knowledge   ← Market Research AI / Platform Intelligence AI（研究层）
   ▼
Evidence    ← Evidence Auditor AI（证据守门）
   ▼
Strategy    ← Growth Analyst AI → Strategy/Content/Campaign Planner AI（诊断+方案层）
   ▼
Execution   ← Planner 类生成草稿 + 人/外包执行（执行层）
   ▼
Validation  ← Validation Analyst AI（验证层）
   ▼
Experience  ← Experience Curator AI 提名 + 人审定（经验层）
   ▲                                                   │
   └────────── Risk Auditor + CGO AI 全程横切 ──────────┘
                        （人工审批贯穿每个闸门）
```

> **最终定位**：AIGO 把这条增长链上的每一环，都配上了"哪位 AI 专业角色负责、依赖什么证据、受谁审计、由谁审批"的组织答案。**它是 MGOS 的组织层——让这家"增长公司"里，每个 AI 各就各位、相互制衡、由人领导，既高效又可信地把商家的增长干成。**

---

## 附：AIGO 与前 8 份架构的一致性

| 文档 | AIGO 如何承接 |
|------|--------------|
| evidence-framework | 四铁律 + E0–E3 + 知识/经验访问的证据约束 |
| merchant-validation-system | Validation Analyst AI 执行 MVS；经验入库须经 MVS |
| growth-intelligence / experience-base | Experience Curator 提名、人审定、不自升（升级门槛一致）|
| merchant-growth-operating-system | AIGO 是 MGOS 五段闭环的"谁来干"组织层 |
| growth-methodology | Risk Auditor 守增长铁律；Planner 守能力/杠杆/行业 |
| role-model / review-policy / ai-work-rules | AI 无决策权、人工审批、生产审计分离 |

> 本文为只读业务组织架构分析，未改动任何代码或既有业务文档；按 CHANGE_POLICY 属"新增文档（低风险）"。
