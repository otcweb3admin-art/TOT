import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listMerchants } from "@/lib/merchants/data";
import { findDemoMerchant } from "@/lib/dashboard/home";
import { IntakeGuidanceBox } from "@/components/merchants/intake-guidance-box";
import { IntakeStepCard } from "@/components/merchants/intake-step-card";
import {
  isDemoMerchant,
  DemoDataBadge,
  isUatMerchant,
  UatDataBadge,
} from "@/components/merchants/demo-data-badge";
import { formatDateTime } from "@/components/merchants/format";
import { PageHeader } from "@/components/ui/page-header";
import { btnSecondary } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Merchant Intake Wizard (TASK-064): one continuous, plain-language guide that turns the
 * scattered intake pages into a clear recording order (create → profile → baseline →
 * operating capacity → TB-001 diagnosis → workspace check). UI/path-integration ONLY —
 * reuses existing pages, actions, data helpers and permissions; changes no business logic.
 */
export default async function MerchantIntakeWizardPage() {
  const user = await requireUser();
  const [demo, merchants] = await Promise.all([
    findDemoMerchant(user), // permission-filtered
    listMerchants(user), // permission-filtered, newest first
  ]);
  const recent = merchants.slice(0, 5);

  const STEPS = [
    {
      title: "Step 1 · 创建商家",
      fills: ["商家名称", "行业", "城市 / 区域", "联系人与联系方式"],
      why: "这是后续所有资料（画像 / 基准 / 诊断…）挂靠的根记录。",
      ifUnknown: "基础信息须线下确认后再建；真实商家需负责人授权，练习请用 DEMO。",
      entryHref: "/dashboard/merchants/new",
      entryLabel: "新建商家",
      note: "已建过的商家在下方「最近商家」继续录入",
    },
    {
      title: "Step 2 · 填写商家画像（Profile）",
      fills: ["商家是谁、服务什么客户", "卖什么产品 / 服务", "主要卖点", "当前线上基础"],
      why: "画像是诊断和内容方向的事实基底；卖点要让客户 3 秒能看懂。",
      ifUnknown: "先保存草稿，不确定的写「待补充」，回到 Field Pack 补问商家，不要编。",
      entryHref: "/dashboard/merchants",
      entryLabel: "选择商家 → 详情页点「商家画像」",
    },
    {
      title: "Step 3 · 填写基线数据（Baseline）",
      fills: ["当前客流 / 咨询 / 成交", "客单价、营收估计", "数据来源与可信度"],
      why: "没有基线就无法证明增长。后台 / 截图 / 口述 / 估计都可以记，但必须标来源；口述不能标高可信。",
      ifUnknown: "没有数据就写「待补充」并把可信度选 unknown / low，不要编数字。",
      entryHref: "/dashboard/merchants",
      entryLabel: "选择商家 → 详情页点「增长前基准」",
    },
    {
      title: "Step 4 · 填写履约与组织能力（Operating Capacity）",
      fills: ["客户来了谁接、多久响应", "高峰期能否接住", "老板是否单点、员工能否配合"],
      why: "这一步决定商家能不能承接增长——接不住的引流只会放大风险，不适合马上引流要如实记。",
      ifUnknown: "按实际情况记录，缺口留空或写「待补充」，不要替商家美化。",
      entryHref: "/dashboard/merchants",
      entryLabel: "选择商家 → 工作台点「编辑经营承接能力」",
    },
    {
      title: "Step 5 · 填写初步诊断（TB-001 商家诊断）",
      fills: ["当前主要增长问题在哪", "是渠道、卖点、履约、现金流、组织，还是数据缺口"],
      why: "诊断要基于前面采到的事实（画像 + 基准 + 承接能力）。诊断不是最终结论，需要人工确认。",
      ifUnknown: "缺证据的判断写「待验证」；可以先记商家自述，但要标明是自述。",
      entryHref: "/dashboard/merchants",
      entryLabel: "选择商家 → 详情页点「TB-001 商家诊断」",
    },
    {
      title: "Step 6 · 进入工作台检查缺口",
      fills: ["查看链路状态与五器官摘要", "查看角色权限提示", "看哪些节点还缺资料"],
      why: "工作台一页看全：哪一步没填、经营健康哪一格有风险，再决定继续补录、创建交接、还是进入下一步准备。",
      ifUnknown: "工作台提示是规则参考，不是系统决策；是否继续由负责人确认。",
      entryHref: "/dashboard/merchants",
      entryLabel: "选择商家 → 打开工作台",
    },
  ];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title="商家接入向导"
        status="真实试点前准备态"
        description="把 Field Pack 线下采集到的资料，按推荐顺序录入系统。真实商家接入需负责人授权。"
        actions={
          <Link href="/dashboard" className={btnSecondary}>
            ← 首页
          </Link>
        }
      />

      <IntakeGuidanceBox
        tone="warning"
        title="录入前必读"
        items={[
          "先采集资料（Field Pack），再录入系统。",
          "不确定的数据标记为「待补充」，不要编数据。",
          "不承诺增长结果；DEMO 不等于真实案例。",
          "AI 只是辅助草稿，人工确认后才进入下一步。",
        ]}
      />

      {/* DEMO 学习区 */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">先用 DEMO 学习接入流程</h2>
        {demo ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/merchants/${demo.id}/workspace`}
              className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
            >
              打开 DEMO 工作台（{demo.name}）
            </Link>
            <span className="text-[11px] text-rose-700 dark:text-rose-400">
              DEMO 只用于演示 / 培训，不得当真实案例。
            </span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            DEMO 暂未创建——请在项目目录运行 <code>npm run seed:demo</code> 生成演示商家（系统不会自动创建）。
          </p>
        )}
      </section>

      {/* 录入步骤 */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">推荐录入顺序（6 步）</h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <IntakeStepCard key={s.title} index={i + 1} {...s} />
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-zinc-400">
          录完 Step 1~5 后，TB-002~TB-008（账号搭建 / 素材采集 / 内容运营 / 直播·活动规划 /
          线索转化 / 数据复盘 / 90 天增长计划）可视资料完整度在商家详情页继续补录为草稿；
          数据复盘与 90 天计划在没有真实执行结果前不要强行「已完成」。
        </p>
      </section>

      {/* 最近商家继续录入 */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-1 text-sm font-medium text-zinc-500">最近商家 · 继续录入</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">
            暂无商家——请先「新建商家」，或运行 <code>npm run seed:demo</code> 生成 DEMO。
          </p>
        ) : (
          <ul className="flex flex-col">
            {recent.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.name}</span>
                  {isDemoMerchant(m.name) && <DemoDataBadge variant="compact" />}
                  {isUatMerchant(m.name) && <UatDataBadge variant="compact" />}
                  <span className="text-[11px] text-zinc-400">
                    创建于 {formatDateTime(m.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2 text-xs">
                  <Link
                    href={`/dashboard/merchants/${m.id}`}
                    className="rounded border border-zinc-300 px-2.5 py-1 dark:border-zinc-700"
                  >
                    详情
                  </Link>
                  <Link
                    href={`/dashboard/merchants/${m.id}/workspace`}
                    className="rounded border border-zinc-300 px-2.5 py-1 dark:border-zinc-700"
                  >
                    工作台
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
