import Link from "next/link";
import { requireUser, type CurrentUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import { getRoleHome, type RoleHome } from "@/lib/dashboard/role-home";
import { findDemoMerchant } from "@/lib/dashboard/home";
import { listMerchants } from "@/lib/merchants/data";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";
import { RoleBoundaryCard } from "@/components/dashboard/role-boundary-card";
import { RoleQueuePreview } from "@/components/dashboard/role-queue-preview";
import { PageHeader } from "@/components/ui/page-header";

// Always render at request time (reads session); never prerender at build.
export const dynamic = "force-dynamic";

const PENDING_TASK_MODEL = "将在 Task 模型上线后启用";

type MerchantLite = { id: string; name: string; createdAt: Date };

/** 角色身份区（所有工作台共用） */
function IdentityCard({ user, home }: { user: CurrentUser; home: RoleHome }) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-500">当前账号</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-zinc-500">用户</dt>
        <dd className="break-all">{user.email}</dd>
        <dt className="text-zinc-500">角色</dt>
        <dd>{roleLabel(user.role)}</dd>
        <dt className="text-zinc-500">工作台</dt>
        <dd>{home.workspaceName}</dd>
      </dl>
      <p className="mt-2 text-xs text-zinc-500">我负责：{home.duties.join("；")}。</p>
    </section>
  );
}

/** 系统状态卡（内部角色共用） */
function SystemStatusCard() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <h2 className="text-sm font-medium text-amber-800 dark:text-amber-300">系统当前状态</h2>
      <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200">
        真实试点前准备态（Pre-Pilot Ready / Conditional Go）
      </p>
      <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
        接入真实商家前先用 Field Pack 线下采集，并经负责人授权。当前不投流、不放量、不承诺增长结果。详见
        <Link href="/dashboard/launch-readiness" className="underline underline-offset-2">
          上线前检查
        </Link>
        。
      </p>
    </section>
  );
}

/** merchant → 客户工作台（V1 占位 + 可读入口；不暴露任何内部入口） */
function CustomerWorkspace() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <RoleQueuePreview
          title="我的项目进度"
          items={[
            { label: "当前阶段", value: "项目立项后此处显示进度" },
            { label: "已完成事项", value: "—" },
            { label: "下一步", value: "项目启动后由负责人同步" },
          ]}
          note="当前版本客户门户为 V1 占位，客户绑定商家和上传资料将在后续 Task 模型 / ClientRequest 中实现。"
        />
        <RoleQueuePreview
          title="需要我配合的事项"
          items={[
            { label: "待补充资料", value: "暂无（项目启动后显示）" },
            { label: "待确认内容", value: "暂无（项目启动后显示）" },
          ]}
          note="有待确认内容时，确认通过后我们才会进入下一步。"
        />
      </div>
      <section className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <h2 className="text-sm font-medium text-zinc-500">联系负责人</h2>
        <p className="mt-1">
          有任何问题请直接联系你的项目负责人；进度、资料与确认事项都会在这里同步。
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          提示：试点阶段为共同验证，我们不承诺具体增长数字。
        </p>
      </section>
    </>
  );
}

/** collector → 采集员工作台 */
function CollectorWorkspace({
  merchants,
  demoHref,
}: {
  merchants: MerchantLite[];
  demoHref: string | null;
}) {
  const recent = merchants.slice(0, 3);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <RoleQueuePreview
          title="我的采集"
          items={[
            { label: "我可见的商家", value: `${merchants.length} 个` },
            {
              label: "继续采集",
              value:
                recent.length === 0 ? (
                  "暂无——先新建商家"
                ) : (
                  <span className="flex flex-wrap gap-x-3">
                    {recent.map((m) => (
                      <Link
                        key={m.id}
                        href={`/dashboard/merchants/${m.id}`}
                        className="underline underline-offset-2"
                      >
                        {m.name}
                      </Link>
                    ))}
                  </span>
                ),
            },
          ]}
          note="先用 Field Pack 线下采集，再回系统按接入向导录入；不知道写「待补充」。"
        />
        <RoleQueuePreview
          title="提交与退回"
          items={[
            { label: "已提交待审核", value: PENDING_TASK_MODEL },
            { label: "被退回修改", value: PENDING_TASK_MODEL },
            { label: "待补充资料", value: "在各商家工作台五器官摘要中查看缺口" },
          ]}
          note="正式提交/退回队列将在 Task 模型上线后启用；现阶段采集完成后线下通知审核员。"
        />
      </div>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">快捷操作</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard href="/dashboard/merchants/new" title="新建商家" description="录入一个商家主体（真实商家需负责人授权）" hint="采集第一步" />
          <QuickActionCard href="/dashboard/merchants/intake" title="商家接入向导" description="按 6 步顺序录入资料" />
          <QuickActionCard href="/dashboard/merchants" title="商家列表" description="查看我可见的商家，继续录入" />
          {demoHref ? (
            <QuickActionCard href={demoHref} title="打开 DEMO 学习" description="演示 / 培训用，非真实商家" />
          ) : (
            <QuickActionCard href="/dashboard/merchants" title="DEMO 暂未创建" description="请运行 npm run seed:demo 生成演示商家" />
          )}
        </div>
      </section>
    </>
  );
}

/** operator → 人工审核工作台 */
function ReviewerWorkspace({
  merchants,
  demoHref,
}: {
  merchants: MerchantLite[];
  demoHref: string | null;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <RoleQueuePreview
          title="审核队列"
          items={[
            { label: "待审核采集包", value: PENDING_TASK_MODEL },
            { label: "待审核 AI 草稿", value: PENDING_TASK_MODEL },
            { label: "待审核外包成果", value: PENDING_TASK_MODEL },
            { label: "待客户确认", value: PENDING_TASK_MODEL },
          ]}
          note="正式审核队列将在 Task 模型上线后启用；现阶段请通过 商家列表 / 工作台 / AI 工作台 推进。"
        />
        <RoleQueuePreview
          title="进行中的商家"
          items={[
            { label: "我可见的商家", value: `${merchants.length} 个` },
            {
              label: "风险商家",
              value: "在各商家工作台「五器官摘要」查看 attention 信号",
            },
            { label: "交接", value: <Link href="/dashboard/handoffs" className="underline underline-offset-2">交接中心</Link> },
          ]}
        />
      </div>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">快捷操作</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard href="/dashboard/merchants" title="商家列表" description="进入详情或工作台，推进节点" hint="日常推进从这里" />
          <QuickActionCard href="/dashboard/ai-workbench" title="AI 工作台" description="生成草稿 → 人工审核后保存（不自动保存）" />
          <QuickActionCard href="/dashboard/handoffs" title="交接中心" description="查看节点交接记录（received ≠ approved）" />
          <QuickActionCard href="/dashboard/merchants/intake" title="商家接入向导" description="6 步录入顺序参考" />
          <QuickActionCard href="/dashboard/launch-readiness" title="上线前检查" description="接入首家真实商家前逐项核对" />
          {demoHref ? (
            <QuickActionCard href={demoHref} title="DEMO 工作台" description="演示 / 培训用，非真实商家" />
          ) : (
            <QuickActionCard href="/dashboard/merchants" title="DEMO 暂未创建" description="请运行 npm run seed:demo" />
          )}
        </div>
      </section>
    </>
  );
}

/** executor → 外包 / 执行工作台（V1 占位） */
function OutsourceWorkspace() {
  return (
    <>
      <RoleQueuePreview
        title="我的任务"
        items={[
          { label: "待开始", value: PENDING_TASK_MODEL },
          { label: "进行中", value: PENDING_TASK_MODEL },
          { label: "已提交待审核", value: PENDING_TASK_MODEL },
          { label: "被退回修改", value: PENDING_TASK_MODEL },
          { label: "已完成", value: PENDING_TASK_MODEL },
        ]}
        note="当前版本尚未启用正式外包任务模型。外包人员未来只会看到分配给自己的任务，不会看到完整商家经营数据。"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">任务与交付标准说明</h2>
          <ul className="mt-2 list-disc pl-5 text-xs [&>li]:mt-0.5">
            <li>每个任务会附：工作类型、目标、素材说明、AI 参考方向、格式要求、截止时间。</li>
            <li>每个任务会附明确「验收标准」——按标准交付，审核通过才算完成。</li>
            <li>被退回时会附修改意见；按意见调整后重新提交。</li>
          </ul>
        </section>
        <section className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">执行注意事项</h2>
          <ul className="mt-2 list-disc pl-5 text-xs [&>li]:mt-0.5">
            <li>素材与设计不得侵犯版权，不使用未授权人物形象。</li>
            <li>成果中不出现夸大或承诺性表述（如保证客流 / 爆单）。</li>
            <li>对任务有疑问联系审核员，不直接联系客户（除非被授权）。</li>
          </ul>
        </section>
      </div>
    </>
  );
}

/** admin → 平台管理工作台 */
function AdminWorkspace({
  merchants,
}: {
  merchants: MerchantLite[];
}) {
  const demoCount = merchants.filter((m) => m.name.startsWith("DEMO_")).length;
  const uatCount = merchants.filter((m) => m.name.startsWith("UAT_")).length;
  const realCount = merchants.length - demoCount - uatCount;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <RoleQueuePreview
          title="数据边界（实时）"
          items={[
            { label: "真实商家", value: `${realCount} 个` },
            { label: "DEMO 演示", value: `${demoCount} 个` },
            { label: "UAT 测试", value: `${uatCount} 个` },
          ]}
          note="DEMO / UAT 不得当真实案例；清理用 seed:demo:clean / seed:uat:clean。"
        />
        <RoleQueuePreview
          title="管理占位"
          items={[
            { label: "账号 / 角色管理", value: "暂以 Supabase 后台 + 受控脚本人工执行（见内部账号指南）" },
            { label: "审计记录", value: "节点已记录 createdBy / updatedBy；统一审计页后续实现" },
          ]}
        />
      </div>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">全局入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard href="/dashboard/merchants" title="商家管理" description="全部商家（admin 全量可见）" />
          <QuickActionCard href="/dashboard/launch-readiness" title="上线前检查" description="系统状态与试点前核对" />
          <QuickActionCard href="/dashboard/handoffs" title="交接中心" description="全部交接记录" />
          <QuickActionCard href="/dashboard/ai-workbench" title="AI 工作台" description="AI 草稿能力（管理视角）" />
          <QuickActionCard href="/dashboard/merchants/intake" title="商家接入向导" description="录入流程参考" />
        </div>
      </section>
    </>
  );
}

/** ai_worker → AI 能力说明页（不开放真人工作台） */
function AiWorkerNotice() {
  return (
    <section className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
      <h2 className="font-medium">本账号不用于人工操作</h2>
      <ul className="mt-2 list-disc pl-5 text-xs [&>li]:mt-0.5">
        <li>ai_worker 是 AI 能力的系统标识，不作为真人工作账号。</li>
        <li>AI 草稿能力由审核员在「AI 工作台」中调用；AI 不直接写入业务节点。</li>
        <li>如你是真人登录到此账号，请联系管理员为你配置正确角色。</li>
      </ul>
    </section>
  );
}

/**
 * Dashboard Home (TASK-070, Phase 1 role routing): /dashboard now renders a DIFFERENT
 * workspace per role — identity, today's queues (live where data exists, explicit
 * placeholders where the Task model isn't built), role-specific quick actions, and a
 * boundary card. Routing/display only: existing URLs stay reachable and permission
 * enforcement is unchanged (role-access + merchant visibility).
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const home = getRoleHome(user.role);

  // 内部数据仅对需要的角色加载（merchant / ai_worker 不读商家数据）。
  const needsData =
    user.role === "collector" || user.role === "operator" || user.role === "admin";
  const [demo, merchants] = needsData
    ? await Promise.all([findDemoMerchant(user), listMerchants(user)])
    : [null, []];
  const demoHref = demo ? `/dashboard/merchants/${demo.id}/workspace` : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title={home.workspaceName}
        status="真实试点前准备态"
        description={`欢迎回来，${user.email} — ${home.description}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <IdentityCard user={user} home={home} />
        <section className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-medium text-zinc-500">下一步建议</h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{home.nextHint}</p>
          <p className="mt-1 text-[11px] text-zinc-400">
            以上为规则提示，不代表系统决策；是否合作 / 放量由负责人确认。
          </p>
        </section>
      </div>

      {user.role === "merchant" && <CustomerWorkspace />}
      {user.role === "collector" && (
        <CollectorWorkspace merchants={merchants} demoHref={demoHref} />
      )}
      {user.role === "operator" && (
        <ReviewerWorkspace merchants={merchants} demoHref={demoHref} />
      )}
      {user.role === "executor" && <OutsourceWorkspace />}
      {user.role === "admin" && <AdminWorkspace merchants={merchants} />}
      {user.role === "ai_worker" && <AiWorkerNotice />}

      <RoleBoundaryCard items={home.boundaries} />

      {(user.role === "collector" || user.role === "operator" || user.role === "admin") && (
        <SystemStatusCard />
      )}
      {user.role === "collector" && <OnboardingGuide demoWorkspaceHref={demoHref} />}
    </main>
  );
}
