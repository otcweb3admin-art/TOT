/**
 * UAT full-flow test (TASK-068): runs the COMPLETE virtual-merchant chain — visibility →
 * detail read → workspace chain → five-organ → AI context → all 7 prompts — over the 3
 * UAT_ scenario merchants. READ-ONLY (touches nothing; only reads UAT_/DEMO_/SMOKE counts).
 * Never prints secrets. Exit non-zero on failure. Run: `npm run uat:full-flow`
 * (after `npm run seed:uat`).
 */
import { prisma } from "@/lib/db";
import { merchantVisibilityWhere } from "@/lib/merchants/permissions";
import { buildMerchantWorkspace } from "@/lib/merchants/workspace";
import { buildOperatingHealthSnapshot } from "@/lib/merchants/operating-health";
import { buildAiMerchantContext } from "@/lib/ai-workbench/context";
import { buildAiPrompt } from "@/lib/ai-workbench/prompts";
import { AI_TASKS } from "@/lib/ai-workbench/tasks";

const A = "UAT_河内咖啡店完整链路";
const B = "UAT_美甲店资料缺失场景";
const C = "UAT_小吃车承接能力不足场景";

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ""): void {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const INCLUDE = {
  owner: true, createdBy: true,
  profile: true, baseline: true, operatingCapacity: true,
  diagnosis: true, accountSetup: true, materialCollection: true,
  contentOperation: true, livePlanning: true, leadConversion: true,
  dataReview: true, ninetyDayGrowthPlan: true,
} as const;

async function main(): Promise<void> {
  console.log("=== UAT FULL-FLOW TEST (read-only) ===");

  // 1) 存在性
  console.log("\n[1 存在性]");
  const uats = await prisma.merchant.findMany({ where: { name: { startsWith: "UAT_" } }, select: { id: true, name: true, ownerProfileId: true, createdByProfileId: true } });
  check("3 个 UAT 商家存在", uats.length === 3, `count=${uats.length}（缺则先跑 npm run seed:uat）`);
  const byName = (n: string) => uats.find((m) => m.name === n);
  check("场景 A/B/C 名称齐", !!byName(A) && !!byName(B) && !!byName(C));
  if (uats.length !== 3) throw new Error("UAT merchants missing — run `npm run seed:uat` first.");

  // 2) 可见性（复用真实权限过滤）
  console.log("\n[2 可见性（listMerchants 等价权限过滤）]");
  const owner = await prisma.userProfile.findFirst({ where: { email: "admin@tot.local" }, select: { id: true, role: true } });
  if (!owner) throw new Error("no admin@tot.local profile");
  const user = { profileId: owner.id, role: owner.role };
  const visible = await prisma.merchant.findMany({ where: { name: { startsWith: "UAT_" }, ...merchantVisibilityWhere(user) }, select: { id: true } });
  check("operator 对 3 个 UAT 商家均可见", visible.length === 3, `visible=${visible.length}`);

  // 3-7) 每商家：详情读取 → 链路 → 五器官 → AI 上下文 → 7 类 Prompt
  console.log("\n[3-7 每商家全链 helper]");
  const loaded: Record<string, NonNullable<Awaited<ReturnType<typeof load>>>> = {};
  async function load(id: string) {
    return prisma.merchant.findFirst({ where: { id, ...merchantVisibilityWhere(user) }, include: INCLUDE });
  }
  for (const name of [A, B, C]) {
    const m = await load(byName(name)!.id);
    check(`详情可读取: ${name}`, !!m);
    if (!m) continue;
    loaded[name] = m;
    const ws = buildMerchantWorkspace(m);
    check(`链路状态生成(10 节点): ${name}`, ws.nodes.length === 10);
    const ohs = buildOperatingHealthSnapshot(m);
    check(`五器官摘要生成(5 器官): ${name}`, ohs.organs.length === 5);
    const ctx = buildAiMerchantContext(m);
    check(`AI 上下文生成 + UAT 标记: ${name}`, ctx.isUat === true && ctx.text.includes("UAT 虚拟测试数据"));
    const prompts = AI_TASKS.map((t) => buildAiPrompt(t, ctx));
    check(`7 类 Prompt 生成 + 全含 UAT 警告: ${name}`, prompts.length === 7 && prompts.every((p) => p.includes("UAT 虚拟测试数据") && p.includes("不得编造数据") && p.includes("不得承诺增长结果")));
  }

  // 8) 场景 B：缺失资料 → 大量待补充,不编造
  console.log("\n[8 场景 B：资料缺失诚实处理]");
  const bCtx = buildAiMerchantContext(loaded[B]);
  check("B 缺失信息清单非空且较多", bCtx.missing.length >= 5, `missing=${bCtx.missing.length}`);
  check("B 上下文显式标「待补充」", bCtx.text.includes("（待补充）") && bCtx.text.includes("明确缺失信息"));
  const bWs = buildMerchantWorkspace(loaded[B]);
  check("B 链路存在 missing 节点（不假装完整）", bWs.nodes.some((n) => n.status === "missing"));
  const aCtx = buildAiMerchantContext(loaded[A]);
  check("A（完整型）缺失明显少于 B", aCtx.missing.length < bCtx.missing.length, `A=${aCtx.missing.length} B=${bCtx.missing.length}`);

  // 9) 场景 C：承接不足 → 风险提示
  console.log("\n[9 场景 C：承接不足风险识别]");
  const cOhs = buildOperatingHealthSnapshot(loaded[C]);
  const ff = cOhs.organs.find((o) => o.key === "fulfillment");
  const org = cOhs.organs.find((o) => o.key === "organization");
  check("C 履约器官 = attention（风险）", ff?.status === "attention", `status=${ff?.status}`);
  check("C 组织器官 = attention（老板单点）", org?.status === "attention", `status=${org?.status}`);
  const cCtx = buildAiMerchantContext(loaded[C]);
  check("C 上下文带承接/单点风险", cCtx.text.includes("接不住") && cCtx.text.includes("单点"));
  check("C TB-001 提示不适合马上放量", (loaded[C].diagnosis?.riskSummary ?? "").includes("不适合马上放量"));
  const aOhs = buildOperatingHealthSnapshot(loaded[A]);
  check("A（完整型）履约/组织非 attention（对照）", aOhs.organs.find((o) => o.key === "fulfillment")?.status !== "attention" && aOhs.organs.find((o) => o.key === "organization")?.status !== "attention");

  // 10-12) 边界：DEMO / SMOKE / 清理范围
  console.log("\n[10-12 数据边界]");
  const demoCount = await prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } });
  check("DEMO 数据未被误删", demoCount >= 1, `DEMO=${demoCount}`);
  const smokeCount = await prisma.merchant.count({ where: { name: { startsWith: "SMOKE_TEST_" } } });
  check("SMOKE 数据无残留", smokeCount === 0, `SMOKE=${smokeCount}`);
  const realCount = await prisma.merchant.count({ where: { AND: [{ name: { not: { startsWith: "UAT_" } } }, { name: { not: { startsWith: "DEMO_" } } }, { name: { not: { startsWith: "SMOKE_TEST_" } } }] } });
  check("真实商家记录未受影响", realCount >= 1, `real=${realCount}`);
  check("UAT 命名互不混淆（≠DEMO/≠SMOKE）", uats.every((m) => !m.name.startsWith("DEMO_") && !m.name.startsWith("SMOKE_TEST_")));
}

main()
  .then(() => {
    console.log(`\n=== SUMMARY: ${pass} passed / ${fail} failed -> ${fail === 0 ? "PASS ✅" : "FAIL ❌"} ===`);
    process.exit(fail === 0 ? 0 : 1);
  })
  .catch((e) => {
    console.error("\nUAT FATAL:", e instanceof Error ? e.message : e);
    console.log(`\n=== SUMMARY: ${pass} passed / ${fail} failed -> FAIL ❌ ===`);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
