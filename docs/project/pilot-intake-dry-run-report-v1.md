# Pilot Intake Dry Run Report V1（首批真实商家·内部接入演练报告）

> 类型：**只读演练报告（Dry Run）· 纯文档**　｜　日期：2026-06-04　｜　任务：TASK-053
> 范围：**不写代码 / 不改 schema / 不新增 migration / 不创建或修改真实商家 / 不进入 MVS / 无 AI·Workflow**。
> 演练对象：**DEMO_小吃车增长样例**（DEMO 演示数据，非真实商家）。
> 上承：[Field Pack](./pilot-intake-field-pack-v1.md) · [Intake Playbook](./pilot-merchant-intake-playbook-v1.md) · [Readiness Gate](./pilot-readiness-gate-v1.md) · [Interview & Evidence Checklist](./pilot-merchant-interview-evidence-checklist-v1.md) · [Evidence Framework](./evidence-framework-specification-v1.md)

---

## 1. Executive Summary（结论摘要）

用 DEMO 商家 + Field Pack 做了一次**端到端内部接入演练**：以登录态实跑了商家列表 + 工作台 + 全部 11 个录入页面（共 **13 个页面，13/13 全部 200 且渲染预期内容**）。

> **结论：未发现任何阻塞真实接入的系统问题。门禁建议 = 🟡 Conditional Go。**

- **Field Pack → 系统页面映射**：13/13 **映射清楚**，每类采集内容都有对应可用页面。
- **工作台可用性**：链路状态、五器官摘要、下一步规则提示、DEMO 安全提示均清晰可懂。
- **证据纪律**：录入页护栏（IntakeGuidanceBox）+ Baseline 可信度 + TB-007/008 draft 提示，均到位提醒"不编、不伪造、标缺口"。
- **经营健康**：五器官可用；**Fulfillment / Organization 因 Operating Capacity 采集已从弱信号升级为可读信号（attention）**。
- **发现的都是体验增强项，非必须修复项**；真实接入的"是否开始"仍是人工商业决策。

---

## 2. Dry Run Scope（演练范围）

| 项 | 内容 |
|---|---|
| 对象 | DEMO_小吃车增长样例（id `66d60a35…`，DEMO 数据）|
| 方式 | 登录态（operator）真实 HTTP GET 各页面，核对渲染 + 字段预填 + 护栏 + 徽章 |
| 覆盖 | 列表 + 工作台 + Profile/Baseline/OperatingCapacity + TB-001~TB-008 全部录入页 |
| 不做 | 不创建/修改真实商家、不写真实数据、不进入 MVS、不改代码 |

---

## 3. Pre-flight Result（前置检查）

| 检查 | 结果 |
|---|---|
| `git status` | ✅ 干净 |
| `npm run smoke:p2` | ✅ **30/30 PASS · cleanup CLEAN · exit 0** |
| DEMO 数据存在 | ✅ DEMO_小吃车增长样例 present（无需重新 seed）|

---

## 4. Field Pack → System Mapping Review（采集包 → 系统映射）

> 实跑：每个 Field Pack 采集块都打开了对应页面，确认 200 + DEMO 预填内容渲染。

| Field Pack 采集块 | 系统页面 | 实跑 | 映射结论 |
|---|---|:--:|---|
| 商家基础信息 | `/merchants/new`（DEMO 用既有记录验证）| ✅ | 映射清楚 |
| Profile 快采 | `/[id]/profile` | ✅ 含护栏 + 预填「招牌炸串」 | 映射清楚 |
| Baseline 快采 | `/[id]/baseline` | ✅ 含护栏 + 预填周期 + 可信度 low | 映射清楚 |
| 五器官采集 | Profile/Baseline/OperatingCapacity/TB-006 | ✅ | 映射清楚（跨页采集）|
| Operating Capacity | `/[id]/operating-capacity` | ✅ 含护栏 + 履约/组织字段 + 「老板单点」 | 映射清楚 |
| TB-001 Diagnosis | `/[id]/diagnosis` | ✅ 含护栏 + 预填 | 映射清楚 |
| TB-002 Account Setup | `/[id]/account-setup` | ✅ 预填「社区招牌炸串」 | 映射清楚 |
| TB-003 Material Collection | `/[id]/materials` | ✅ 预填「出餐过程」 | 映射清楚 |
| TB-004 Content Operation | `/[id]/content-operation` | ✅ 预填 | 映射清楚 |
| TB-005 Live Planning | `/[id]/live-planning` | ✅ 预填「暂不适合直播」 | 映射清楚 |
| TB-006 Lead Conversion | `/[id]/lead-conversion` | ✅ 预填「演示归因思路」 | 映射清楚 |
| TB-007 Data Review | `/[id]/data-review` | ✅ 护栏 + draft「演示复盘」 | 映射清楚 |
| TB-008 Growth Plan | `/[id]/growth-plan` | ✅ 护栏 + draft「演示方向」 | 映射清楚 |
| Workspace / OHC | `/[id]/workspace` | ✅ 五器官 + 链路完整 + DEMO 提示 | 映射清楚 |

- **缺失字段**：无（Field Pack 全部字段都有对应系统字段）。
- **部分映射不清**：无。
- **需要后续增强（非必须）**：系统页面本身**未反向标注**"对应 Field Pack 哪一节"（目前是 Field Pack 单向标"→ 录入哪页"）；可选在页面加一行"对应采集包 X 节"——纯体验项。

---

## 5. Workspace Usability Review（工作台可用性）

| 检查 | 结果 |
|---|---|
| DEMO badge 是否明显 | ✅ 列表 compact 徽章 + 详情/工作台顶部 full 红色提示，**一眼可辨非真实** |
| 完整链路是否看得懂 | ✅ Profile→Baseline→TB-001~008 自上而下，每节点状态徽章 + 入口 |
| missing/draft/completed/archived 是否清晰 | ✅ 工作台顶部有状态说明 + 彩色徽章（DEMO 链路全 completed，TB-007/008 为 draft）|
| 下一步提示是否易懂 | ✅ 「最小链路已完整…」+ 完成度 `11/11`；DEMO 显示链路完整 |
| 五器官摘要对运营是否有帮助 | ✅ 一屏看五器官 signal/attention + 观察/来源/缺口/下一步 |
| 是否易误以为系统在做商业决策 | ✅ **已护栏**：「下一步是规则提示，不是系统决策」+ 「Conditional Go：未授权放量/投流/MVS」+ DEMO 提示 |

---

## 6. Evidence Discipline Review（证据纪律）

> 实跑确认录入页与文档能持续提醒"不编、不伪造、标缺口"。

| 提醒点 | 落地处 | 实跑 |
|---|---|:--:|
| 不编数据 | new/Profile 护栏「不知道写待补充，不要编」 | ✅ |
| 不把口述当高可信 | Baseline 护栏「老板估计不能 high，标 low/medium」+ 可信度选项 | ✅ |
| 不为链路完整强行 completed | TB-007 护栏「需真实结果，别强行 completed」 | ✅ |
| 缺失写待补充 | 全 intake 页护栏 + Field Pack ☐待补充栏 | ✅ |
| 基线标可信度 | Baseline `dataConfidence`（DEMO=low）| ✅ |
| TB-007/008 不伪造 | 护栏「结论仅经验候选」「无依据只 draft」+ DEMO 标 draft「非真实结果」 | ✅ |

- **验证**：DEMO 的 TB-007/TB-008 正确地以 **draft** 存在并标注"演示·非真实结果"——**演练证明系统鼓励诚实的不完整，而非虚假的完整。**

---

## 7. Operating Health Review（经营健康可用性）

DEMO 工作台五器官实跑结果（围绕小吃车模型设计）：

| 器官 | 状态 | 说明 |
|---|---|---|
| Channel 渠道 | **signal** | 有获客/Maps/引流路径 + 归因 |
| Offer | **signal** | 核心卖点 + 转化路径清楚 |
| **Fulfillment 履约** | **attention** | 读到 Operating Capacity 的「高峰出餐压力」风险 |
| Cashflow 现金流 | **signal** | 有基线（低可信）+ 归因思路 |
| **Organization 组织** | **attention** | 读到「老板单点」风险 |

- **重点验证通过**：**Fulfillment / Organization 因 Operating Capacity 采集，已不再是"弱信号"**——工作台显示来源含「经营承接能力采集」、状态升为 **attention**（含 risk）、`weakSignalOnly=false`。这正是 OHC 暴露的两个经营空格被补上的直接体现。
- 五器官能帮运营一眼识别：渠道/Offer 清楚、现金流有基线、**履约与组织有风险**——与小吃车真实经营痛点吻合。

---

## 8. Gaps Found（发现的缺口 · 均非阻塞）

| # | 缺口 | 性质 | 影响 |
|---|---|---|---|
| G1 | 系统页面未反向标注"对应 Field Pack 哪一节" | 体验 | 轻微（Field Pack 已单向标"→录入哪页"）|
| G2 | 无文件上传（素材/证据仅摘要 + 线下截图）| 已知设计 | 真实素材走线下，摘要进系统 |
| G3 | 单 operator 账号，未做多人角色分配 | 运营 | 多人协作前需人工分配 admin/operator |
| G4 | 五器官 attention 仅徽章+观察，未单独高亮 risk 文本 | 体验 | 信息已可见，高亮可选增强（P2-020 ⑤）|
| G5 | TB-006 归因为自由文本，无强制 | 已知设计 | 靠护栏 + 人工把关，符合"不提前平台化" |
| G6 | 真实数据从未跑过 | 本质 | 只能由真实接入消除（即试点目的）|

> **以上无一项阻塞"接入期试点"**——G2/G5 是有意的最小化设计，G1/G4 是体验优化，G3/G6 由人工流程/试点本身处理。

---

## 9. Risk Before Real Merchant Intake（真实接入前的风险）

1. **证据纪律依赖人**：系统**提醒**但不**强制**（护栏是文案，不拦提交）——靠项目负责人抽查来源标注。
2. **真实数据未验证**：演练用 DEMO，真实商家的数据复杂度/配合度仍是未知（试点要消除的）。
3. **MVS 缺位**：放量/收费后无法自动归因/算 ROI——但**接入期不需要**，须在放量前人工补归因口径并后续建 MVS。
4. **承接护栏非硬门**：OHC 五器官 attention 不会自动阻止放量——靠 Field Pack 第 12 节「不应引流判断」+ 人工决策。

---

## 10. Recommended Fixes（建议 · 均为可选增强，无阻塞修复）

| 优先级 | 建议 | 说明 |
|---|---|---|
| 可选 | 工作台高亮履约/组织 risk 文本（G4）| 让 attention 更醒目（P2-020 ⑤）|
| 可选 | 各录入页加一行"对应 Field Pack X 节"（G1）| 双向映射，培训更顺 |
| 流程 | 多人协作前人工分配角色（G3）| 非代码，业务决策 |
| 流程 | 放量/收费前补归因口径，再规划 MVS | 人工 + 后续任务 |
| **无** | **无必须先修复的系统问题** | 不构成 Hold |

---

## 11. Go / Conditional Go / Hold Recommendation（门禁建议）

### 🟡 Conditional Go

- **未发现任何阻塞真实接入的系统问题**（13/13 页面可用、smoke 30/30、映射清楚、护栏到位、五器官可用）。
- 按规则：无阻塞问题 → Conditional Go；且**真实商家接入本身仍是人工商业决策**，故即便系统完美也只给 Conditional Go。
- **放行条件**（沿用 [Readiness Gate](./pilot-readiness-gate-v1.md)）：人工授权 / 只接 1 家 / 遵循 Field Pack + Playbook 证据纪律 / 基线 + 归因先行 / 承接达标再引流 / MVS 后置 / 多人先分角色。

---

## 12. Final Conclusion（结语）

> **第一次内部接入演练完成：Field Pack 能指导采集、系统页面能承接录入、工作台能检查链路与经营健康。** 整条"现场采集 → 系统录入 → 工作台检查"动线在 DEMO 上**跑通且 13/13 可用**。

- ✅ 我们知道 **Field Pack 真的能指导录入**（每块都有对应可用页面 + 预填验证）。
- ✅ 我们知道 **DEMO 工作台适合演示和培训**（链路 + 五器官 + 安全护栏齐全）。
- ✅ 我们知道**真实接入前的体验缺口都是可选增强，不是阻塞**。
- ✅ 我们**不会在没有演练的情况下直接面对真实商家**——这次演练就是那道前置。

> 本任务成功**不代表真实商家录入开始**；代表 **TOT 完成了第一次内部试点接入演练**。是否启动真实试点，由人决定（Human Commercial Authority）。

> 本文为只读演练报告；按 CHANGE_POLICY 属"新增文档（低风险）"。**未改动任何代码 / schema / migration / 真实数据**（DEMO 演练对象保持不变）。
