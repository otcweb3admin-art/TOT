# WORKFLOW_STATE_MODEL.md — 工作流状态模型

## 核心原则

> **禁止跳过审核直接进入下一流程。**
> 每个流程节点必须经过完整的状态流转，不得绕过 `reviewing` 直接到 `completed`。

---

## 标准状态定义

每个工作流节点至少包含以下状态：

| 状态值 | 中文说明 | 触发条件 |
|--------|----------|----------|
| `draft` | 草稿 | 节点创建，开始填写，未提交 |
| `submitted` | 已提交 | 采集员/商家完成填写并提交 |
| `ai_generated` | AI 已生成 | AI Worker 完成报告/方案生成 |
| `reviewing` | 人工审核中 | 运营人员/管理员开始审核 |
| `approved` | 审核通过 | 人工确认产物，可进入下一节点 |
| `rejected` | 审核退回 | 人工认为产物不合格，需重新生成或修改 |
| `completed` | 已完成 | 节点所有执行任务完成，归档 |

---

## 标准状态流转图

```
[创建节点]
    ↓
  draft
    ↓ 提交
submitted
    ↓ AI 处理
ai_generated
    ↓ 进入人工审核
reviewing ──→ rejected ──→（重新生成/修改）──→ ai_generated
    ↓ 审核通过
approved
    ↓ 执行完成
completed
```

---

## 各节点状态适用说明

### 商家接入
```
draft → submitted → approved（采集员确认信息完整）→ 进入诊断节点
```

### 商家诊断（TB-001）
```
draft → submitted → ai_generated → reviewing → approved / rejected → completed
```

### 账号搭建（TB-002）
```
draft → ai_generated → reviewing → approved / rejected → completed
```

### 素材采集（TB-003）
```
draft → submitted → reviewing → approved / rejected → completed
```
> 注：素材采集无 AI 生成环节，直接由人工确认。

### 内容运营（TB-004）
```
draft → ai_generated → reviewing → approved / rejected → completed
```

### 直播规划（TB-005）
```
draft → ai_generated → reviewing → approved / rejected → completed
```

### 引流转化（TB-006）
```
draft → ai_generated → reviewing → approved / rejected → completed
```

### 数据复盘（TB-007）
```
submitted → ai_generated → reviewing → approved / rejected → completed
```

### 90天优化（TB-008）
```
draft → ai_generated → reviewing → approved / rejected → completed
```

---

## 状态操作权限

| 状态变更操作 | 允许操作的角色 |
|-------------|---------------|
| `draft` → `submitted` | 采集员、商家 |
| `submitted` → `ai_generated` | AI Worker（系统自动） |
| `ai_generated` → `reviewing` | 运营人员、管理员 |
| `reviewing` → `approved` | 运营人员、管理员 |
| `reviewing` → `rejected` | 运营人员、管理员 |
| `rejected` → `ai_generated` | AI Worker（系统自动重新生成） |
| `approved` → `completed` | 管理员 |
| 强制状态推进/回退 | 仅管理员（紧急情况） |

---

## 禁止的状态跳跃

以下状态跳跃**严格禁止**：

| 禁止的跳跃 | 原因 |
|------------|------|
| `ai_generated` → `completed` | 跳过人工审核 |
| `submitted` → `approved` | 跳过 AI 生成和审核 |
| `draft` → `completed` | 跳过所有流程 |
| `reviewing` → `draft` | 退回应使用 `rejected`，不得直接退回草稿 |
| `approved` → `reviewing` | 已通过审核不可重新审核（需走变更流程） |
