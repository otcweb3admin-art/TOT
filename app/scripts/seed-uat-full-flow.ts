/**
 * UAT full-flow rehearsal seed (TASK-075) — creates the virtual merchant + virtual role
 * profiles the rehearsal script (uat-full-flow-rehearsal.ts) drives through all four loops
 * (采集 / AI 草稿 / 外包 / 客户确认). UAT ≠ DEMO ≠ SMOKE ≠ 真实数据：
 *   - every row is prefixed UAT_ (merchant name / task titles / profile emails)
 *   - UAT profiles get a random authUserId and NO Supabase auth user — they can NEVER log
 *     in; they exist only as assignment targets for permission checks.
 *   - cleanup is `npm run clean:uat` (strictly UAT_ prefixes; DEMO/SMOKE/real untouched).
 * Idempotent: clears existing UAT_ data first. Run: `npm run seed:uat`.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

const NOTE =
  "【UAT 虚拟测试数据】仅用于系统全流程彩排，不是真实商家，不得当真实案例 / 不得对外引用 / 不得用于增长承诺 / 不得进入经验库。";

async function clearUat(): Promise<void> {
  // tasks first (merchant-less UAT tasks matched by title), then merchants (cascade), then profiles.
  const w = await prisma.workItem.deleteMany({
    where: { OR: [{ title: { startsWith: "UAT_" } }, { merchant: { name: { startsWith: "UAT_" } } }] },
  });
  const m = await prisma.merchant.deleteMany({ where: { name: { startsWith: "UAT_" } } });
  const p = await prisma.userProfile.deleteMany({ where: { email: { startsWith: "UAT_" } } });
  if (w.count || m.count || p.count) {
    console.log(`[seed:uat] cleared existing UAT_ data first: work-items=${w.count} merchants=${m.count} profiles=${p.count}`);
  }
}

async function main(): Promise<void> {
  console.log("=== UAT FULL-FLOW SEED (TASK-075) ===");
  const owner = await prisma.userProfile.findFirst({ where: { email: "admin@tot.local" } });
  if (!owner) {
    console.error("[seed:uat] No UserProfile for admin@tot.local — log in once first. Will NOT create auth users.");
    process.exit(1);
  }

  await clearUat();

  // 1) UAT virtual merchant（owner = admin@tot.local profile，operator 登录即可见）.
  const merchant = await prisma.merchant.create({
    data: {
      name: "UAT_咖啡店全链彩排",
      industry: "UAT·咖啡 / 餐饮",
      city: "Hanoi",
      country: "Vietnam",
      contactName: "UAT 客户联系人",
      status: "active",
      notes: NOTE,
      ownerProfileId: owner.id,
      createdByProfileId: owner.id,
    },
  });
  await prisma.merchantProfile.create({
    data: {
      merchantId: merchant.id,
      industryDetail: "UAT·社区咖啡店（堂食+外带）",
      targetCustomerSummary: "UAT·周边上班族",
      coreOfferSummary: "UAT·滴漏咖啡套餐",
      currentAcquisitionSummary: "UAT·门口自然客流 + Google Maps",
      growthGoalSummary: "UAT·建立线上获客入口（彩排用，不承诺增长结果）",
      notes: NOTE,
      createdByProfileId: owner.id,
      updatedByProfileId: owner.id,
    },
  });

  // 2) UAT role profiles — assignment targets only（无 auth user，永远无法登录）.
  const mk = (email: string, role: "collector" | "operator" | "executor" | "merchant") =>
    prisma.userProfile.create({
      data: { authUserId: randomUUID(), email, role, status: "active" },
    });
  const collector = await mk("UAT_collector@uat.local", "collector"); // UAT_采集员
  const operator = await mk("UAT_operator@uat.local", "operator"); // UAT_审核员
  const executor = await mk("UAT_executor@uat.local", "executor"); // UAT_外包执行员
  const client = await mk("UAT_client@uat.local", "merchant"); // UAT_客户联系人

  console.log(`[seed:uat] merchant: ${merchant.name}`);
  console.log(
    `[seed:uat] profiles: 采集员=${collector.email} 审核员=${operator.email} 外包=${executor.email} 客户=${client.email}（均无 auth user，不可登录）`,
  );
  console.log("[seed:uat] 初始 WorkItem 由 `npm run uat:full-flow` 按业务时序创建。");
  console.log("[seed:uat] 提醒：UAT 数据不得当真实案例；清理用 `npm run clean:uat`。");
  console.log("=== SEED DONE ✅ ===");
}

main()
  .catch((e) => {
    console.error("[seed:uat] FATAL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
