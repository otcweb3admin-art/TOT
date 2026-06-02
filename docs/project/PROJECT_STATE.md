# PROJECT_STATE.md — 项目当前状态（交接棒）

> **活文档**：每个工作块结束更新。接手本项目请先读 [/CLAUDE.md](../../CLAUDE.md)，再读本文件。
> 本文件只回答："**现在进展到哪 · 下一步做什么 · 有哪些待决问题**"。规则与文档全貌见 CLAUDE.md。
> 最后更新：2026-06-02　｜　对应提交：见 `git log -1`（本文件随附提交）

---

## 一句话状态
业务架构已成体系（约 22 份架构文档全部上线，"增长运行机制"六层已闭环：诊断→策略→计划→执行→监控→复盘优化，接 MVS+经验库成飞轮）；**代码侧仍为 create-next-app 脚手架，未开始写业务代码**。下一步可选：继续产出架构 / 进入 P0 地基落地。

## 当前阶段
- **文档/架构**：Phase 2 进行中（已出 commercial-operating、merchant-success 等）。
- **代码**：阶段1 已授权写 MVP 代码，但**尚未动手**（P0 地基方案已就绪、未执行）。

## 已完成（指针见 CLAUDE.md「文档地图」）
- 8 封板模板 TB-001~008 + 治理文档 + 架构地基。
- **Phase 0 业务地基**（6）：audit / knowledge / methodology / asset / evidence / intelligence。
- **集成·验证**：MGOS / MVS / AIGO / 经验库 v1+v2 / 经验应用。
- **交付·运营**：growth-delivery / pilot(R2) / commercial-operating / merchant-success。
- **增长运行机制（六层闭环·已完成）**：诊断(门1)→策略(门2)→计划(门3)→执行(门4)→监控(过程反馈)→复盘优化(学习层)：growth-diagnostic / -strategy / -planning / -execution / -monitoring / -review-optimization。复盘→优化→下一轮，接 MVS 验证 + Experience Base 成完整飞轮。
- **工程方案**：MVP_BUILD_PLAN、P0_FOUNDATION_PLAN（地基与部署，**未执行**）。
- **基础设施**：仓库上线；自动推送 hook（docs/ 改动每轮自动 commit+tag+push）；内置记忆（CLAUDE.md + auto-memory + auto-dream）；CLAUDE.md 接续入口 + 本交接棒。

## 进行中 / 下一步（候选，由用户决定方向）
- A. 继续按 TASK 产出/细化架构文档；或
- B. **进入 P0 地基落地**：Supabase + Prisma + Vercel + 空壳上线（需用户提供连接信息，见 [P0_FOUNDATION_PLAN.md](./P0_FOUNDATION_PLAN.md) 第 8 节）。

## 待决 / 待用户提供
- P0 执行所需：Supabase 连接串/keys、Vercel 项目状态、Anthropic API Key（**密钥走环境变量/后台，不入库**）。
- 之前聊天中暴露过的 GitHub PAT：建议尽快 revoke（若未做）。
- 方向未定：上面 A / B 选哪条。

## 接续要点（换窗口/换机/换 AI）
- 仓库：`github.com/otcweb3admin-art/TOT`（monorepo：`docs/` + `app/`；Vercel 部署 Root=`app`）。
- 推送凭证：本机 `lianggang405-bit`（write 协作者）缓存凭证；**换机需重配凭证 + 个人 hook**（hook/settings.local.json 已 gitignore，不随仓库走）。
- 完整接续本对话：在同机 Claude Code 用 `/resume`；否则靠仓库 + CLAUDE.md + 本文件。

---
> 更新纪律：完成一个工作块后，更新"一句话状态/当前阶段/下一步/待决"，随 docs 自动推送上线。
