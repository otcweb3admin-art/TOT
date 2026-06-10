import Link from "next/link";

/**
 * "新手怎么开始" guide block on the dashboard home (TASK-063). Pure copy — operational
 * guidance only; it does NOT implement real-merchant auto-intake and promises nothing.
 */
export function OnboardingGuide({ demoWorkspaceHref }: { demoWorkspaceHref: string | null }) {
  return (
    <section
      id="getting-started"
      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-sm font-medium text-zinc-500">新手怎么开始</h2>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
          <p className="text-sm font-medium">如果只是演示 / 学习</p>
          <ol className="mt-1.5 list-decimal pl-5 text-xs text-zinc-600 dark:text-zinc-400 [&>li]:mt-0.5">
            <li>
              {demoWorkspaceHref ? (
                <Link href={demoWorkspaceHref} className="underline underline-offset-2">
                  打开 DEMO 商家
                </Link>
              ) : (
                "打开 DEMO 商家（需先运行 seed:demo）"
              )}
            </li>
            <li>查看商家工作台（链路总览）</li>
            <li>查看经营健康摘要（五器官）</li>
            <li>查看角色权限提示（可编辑 / 只读）</li>
            <li>查看环节交接记录</li>
          </ol>
        </div>

        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
          <p className="text-sm font-medium">如果要接入真实商家</p>
          <ol className="mt-1.5 list-decimal pl-5 text-xs text-zinc-600 dark:text-zinc-400 [&>li]:mt-0.5">
            <li>先用候选商家跟进表线下接触（docs 内有模板）</li>
            <li>用现场采集包（Field Pack）采集资料</li>
            <li>
              <Link href="/dashboard/merchants/new" className="underline underline-offset-2">
                新建商家
              </Link>
              并填写基础资料
            </li>
            <li>填写 商家画像 / 增长前基准 / 经营承接能力</li>
            <li>进入工作台检查缺口（五器官）</li>
            <li>必要时创建交接记录，交给下一个角色</li>
            <li>AI 仅作为草稿辅助，人工确认后再保存</li>
          </ol>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-zinc-400">
        各节点中文对照：TB-001 商家诊断 · TB-002 账号搭建 · TB-003 素材采集 · TB-004 内容运营 ·
        TB-005 直播 / 活动规划 · TB-006 线索转化 · TB-007 数据复盘 · TB-008 90 天增长计划。
        提示均为操作引导，不代表系统决策；是否合作 / 放量由负责人确认。
      </p>
    </section>
  );
}
