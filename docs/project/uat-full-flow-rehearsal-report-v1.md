# UAT 全链彩排报告 V1（TASK-075）

> 状态：已执行 ✅ · 结论：**PASS** · 日期：2026-06-12
> 纪律：UAT 虚拟数据，不得当真实案例 / 不得对外引用 / 不得进入经验库 / 不承诺增长结果。

## 1. 彩排目标
在真实客户进入前，用一组 UAT 虚拟数据把已上线的四条闭环串成**一条完整线上代运营流程**跑通：
`采集任务 → 人工审核（退回/重交/通过/完成）→ AI 草稿审核 → 人工保存节点（模拟）→ 外包任务（分配/提交/退回/重交/验收/完成）→ 客户确认（发起/提意见/处理/重发/确认/收口）`，确认系统不会在关键环节卡住，且每一环 AI 不拍板、不自动流转、不自动写节点。

## 2. 彩排环境
- 本地（Windows）+ 共享 Supabase 库（与线上同库）；代码 = `checkpoint-client-confirmation-portal-flow` 之后的工作区。
- 执行方式：`npm run seed:uat` → `npm run uat:full-flow`（51 项检查）→ UI 手工/HTTP 验证（5 项）→ `npm run clean:uat` → `npm run uat:check-clean`。
- 脚本用与线上 server action **相同的权限/状态机检查函数**（lib/tasks/access、lib/ai-workbench/draft-review）验证每一步允许后，再以等价写入复现状态流转；HTTP/表单层在 TASK-071~074 已逐环真实 E2E 验证。**UI 渲染部分**由本次 operator 视角 HTTP 检查 + TASK-070~074 的逐角色验证覆盖（collector/executor/merchant 视角 UI 在 073/074 已真实切换验证）。

## 3. 使用的 UAT 商家
`UAT_咖啡店全链彩排`（owner=admin@tot.local 的 operator profile；notes 写明不得当真实案例；带 MerchantProfile 摘要，字段均带 UAT· 标记）。

## 4. 使用的 UAT 角色 / profile
4 个 UAT 测试 profile（**均无 Supabase auth user，永远不可登录**，仅作分配目标与权限检查主体；email 带 UAT_ 前缀可一键清理）：
`UAT_collector@uat.local`（采集员）/ `UAT_operator@uat.local`（审核员）/ `UAT_executor@uat.local`（外包执行员）/ `UAT_client@uat.local`（客户联系人，role=merchant）。
注：商家级可见性以 owner（admin@tot.local）名义验证；角色级权限用对应 UAT profile。

## 5. 覆盖的流程（7 个 UAT_ 任务）
采集原始资料（含退回重交）→ 审核采集资料 → AI 诊断草稿审核（含人工保存模拟）→ 外包图片设计（含退回重交）→ 处理客户反馈跟进 → 客户确认 ×2（提意见 + 确认通过）。

## 6. 各阶段结果（rehearsal 51/51 + UI 5/5）
| 阶段 | 结果 | 要点 |
|---|---|---|
| 1 UAT 商家准备 | **PASS** | 前缀/隔离/备注/operator+admin 可见 |
| 2 采集任务闭环 | **PASS** | collector 不能 approve;退回意见入 reviewNote;采集包入 resultSummary;completed 有 completedAt |
| 3 AI 草稿审核闭环 | **PASS** | submitted→人工通过;**通过后诊断节点仍为空（AI 未自动写）**;人工保存模拟后节点有 UAT 标记内容 |
| 4 外包任务闭环 | **PASS** | executor 仅见自己任务;op/admin 不可代提交;v2 覆盖最新;**approved 不自动 complete、不自动建客户确认** |
| 5 客户确认闭环 | **PASS** | 审核员驱动发起;客户仅见自己事项;意见入 reviewNote 且 operator 可读;**确认不自动完成/不自动建后续任务**;人工收口 |
| 6 角色计数联动 | **PASS** | collector=1/operator=7/executor=1/merchant=2/ai_worker=null/admin=7（与页面同查询复现;UI 另验） |
| 7 数据隔离 | **PASS** | DEMO 1→1、SMOKE 0→0、真实 1→1;UAT 任务 7 条全带前缀 |
| UI 手工（operator HTTP） | **PASS** | 任务中心可见全部 UAT 任务/类型/商家;completed 可筛;商家列表带 UAT 徽章;首页正常 |

## 7. 是否发现断点
**未发现流程断点**——四条闭环可作为一条连续流程运转,无环节卡死、无权限缺口、无需要绕过系统的步骤。

## 8. 是否修复小问题
本次彩排未发现需修复的 UI/文案/路由问题（TASK-073/074 验证期间的问题已在各自任务内修复）。唯一调整:npm 命令名按本任务规格重指向（见 §16 注）。

## 9. 暂不处理的问题
- UAT 任务在任务中心无专属徽章（仅靠 UAT_ 标题前缀 + 商家名/商家徽章辨识）→ 后续增强项。
- outsource_review 类型未在彩排中独立使用（外包验收直接在 outsource_execution 上完成,V1 设计如此）。
- UAT profile 不可登录,故 collector/executor/merchant 的**登录态 UI** 由 TASK-073/074 的角色切换 E2E 覆盖,本次未重复。

## 10. 仍需人工操作的环节（设计如此,非缺陷）
AI 草稿生成（复制 Prompt 到外部 AI）/ AI 草稿审核 / **审核通过后保存到业务节点** / 外包验收 / 退回意见填写 / 发起客户确认 / 客户确认后的推进与收口 / 一切 completed 标记。

## 11–13. 三条红线核验
- **AI 是否自动写节点：否**（approve 后诊断节点仍为 null,实测断言;保存为显式人工模拟并标注「这是 UAT 人工保存模拟，不是 AI 自动写入」）。
- **外包是否自动发布：否**（approved 后 completedAt=null,无任何发布动作,无客户确认任务自动产生）。
- **客户确认是否自动完成：否**（approved 后 completedAt=null,任务总数不变,由审核员人工 completed）。

## 14–15. 清理与隔离
- `clean:uat`：deleted work-items=7 merchants=1 profiles=4 → residue 全 0 **CLEAN ✅**;`uat:check-clean` 复核 0/0/0。
- DEMO 1→1、SMOKE 0→0、真实商家 1→1 **UNTOUCHED ✅**;git 工作区无脚本运行产生的无关文件。

## 16. 下一步建议
1. **人工授权后接入首家真实商家**（Conditional Go 条件下）：流程层面彩排已通过;接入前按内部账号指南人工创建真实分角色账号（collector/operator/executor/客户）,首单建议由审核员全程跟流程清单走。
2. 增强项（小）：任务中心 UAT/DEMO 任务行徽章;outsource_review 的独立使用约定;客户确认事项支持「重新发起」快捷操作。
3. 中期：ReviewRecord 沉淀审核记录、商家工作台挂任务列表（`listWorkItemsForMerchant` 已有未挂 UI）。

> 注（命令变更）：按 TASK-075 规格,`seed:uat` / `clean:uat` / `uat:full-flow`（+`uat:check-clean`）现指向全链彩排脚本;TASK-068 的 3 场景资产沙盒保留,改名 `seed:uat:scenarios` / `seed:uat:scenarios:clean` / `uat:scenarios-check`。

## 结论

```text
PASS
```

采集、人工审核、AI 草稿、外包、客户确认已可作为**一条完整线上代运营流程**运转;全程人工把关,AI 不自动写节点、外包不自动发布、客户确认不自动完成;UAT 数据可一键清理且不污染 DEMO/SMOKE/真实数据。
