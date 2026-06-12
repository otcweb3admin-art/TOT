/**
 * UAT cleanup (TASK-075). STRICT UAT_ prefix only — DEMO_ / SMOKE_TEST_ / real data are
 * never touched (counts are asserted before/after to prove it).
 *
 *   npm run clean:uat        -> delete all UAT_ work-items / merchants(+cascade) / profiles
 *   npm run uat:check-clean  -> count only (no delete); exit 0 when fully clean, 1 otherwise
 */
import { prisma } from "@/lib/db";

const CHECK_ONLY = process.argv.includes("--check");

async function counts() {
  const [merchants, workItems, profiles, demo, smoke] = await Promise.all([
    prisma.merchant.count({ where: { name: { startsWith: "UAT_" } } }),
    prisma.workItem.count({
      where: { OR: [{ title: { startsWith: "UAT_" } }, { merchant: { name: { startsWith: "UAT_" } } }] },
    }),
    prisma.userProfile.count({ where: { email: { startsWith: "UAT_" } } }),
    prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } }),
    prisma.merchant.count({ where: { name: { startsWith: "SMOKE_TEST_" } } }),
  ]);
  return { merchants, workItems, profiles, demo, smoke };
}

async function main(): Promise<void> {
  const before = await counts();

  if (CHECK_ONLY) {
    const clean = before.merchants === 0 && before.workItems === 0 && before.profiles === 0;
    console.log(
      `[uat:check-clean] UAT merchants=${before.merchants} work-items=${before.workItems} profiles=${before.profiles} -> ${clean ? "CLEAN ✅" : "RESIDUE ⚠"}`,
    );
    console.log(`[uat:check-clean] DEMO=${before.demo} SMOKE=${before.smoke}（仅展示，不属于 UAT 清理范围）`);
    process.exit(clean ? 0 : 1);
  }

  console.log("=== UAT CLEAN (TASK-075) ===");
  // order: work-items（含未挂商家的，按标题前缀）-> merchants（级联其资产与任务）-> profiles。
  const w = await prisma.workItem.deleteMany({
    where: { OR: [{ title: { startsWith: "UAT_" } }, { merchant: { name: { startsWith: "UAT_" } } }] },
  });
  const m = await prisma.merchant.deleteMany({ where: { name: { startsWith: "UAT_" } } });
  const p = await prisma.userProfile.deleteMany({ where: { email: { startsWith: "UAT_" } } });

  const after = await counts();
  const clean = after.merchants === 0 && after.workItems === 0 && after.profiles === 0;
  const isolated = after.demo === before.demo && after.smoke === before.smoke;
  console.log(`[clean:uat] deleted work-items=${w.count} merchants=${m.count} profiles=${p.count}`);
  console.log(
    `[clean:uat] residue: merchants=${after.merchants} work-items=${after.workItems} profiles=${after.profiles} -> ${clean ? "CLEAN ✅" : "DIRTY ❌"}`,
  );
  console.log(
    `[clean:uat] isolation: DEMO ${before.demo}->${after.demo} SMOKE ${before.smoke}->${after.smoke} -> ${isolated ? "UNTOUCHED ✅" : "CHANGED ❌"}`,
  );
  process.exit(clean && isolated ? 0 : 1);
}

main().catch((e) => {
  console.error("[clean:uat] FATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
