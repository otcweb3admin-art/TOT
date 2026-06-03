-- CreateEnum
CREATE TYPE "NinetyDayGrowthPlanStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantNinetyDayGrowthPlan" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "NinetyDayGrowthPlanStatus" NOT NULL DEFAULT 'draft',
    "planPeriodLabel" TEXT,
    "stageGoalSummary" TEXT,
    "roadmapSummary" TEXT,
    "platformPrioritySummary" TEXT,
    "contentRouteSummary" TEXT,
    "leadConversionRouteSummary" TEXT,
    "kpiSummary" TEXT,
    "riskSummary" TEXT,
    "cycleJudgmentSummary" TEXT,
    "nextStageDirectionSummary" TEXT,
    "notes" TEXT,
    "sourceBaselineMetricId" TEXT,
    "sourceDiagnosisId" TEXT,
    "sourceLeadConversionId" TEXT,
    "sourceDataReviewId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantNinetyDayGrowthPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantNinetyDayGrowthPlan_merchantId_key" ON "MerchantNinetyDayGrowthPlan"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantNinetyDayGrowthPlan" ADD CONSTRAINT "MerchantNinetyDayGrowthPlan_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantNinetyDayGrowthPlan" ADD CONSTRAINT "MerchantNinetyDayGrowthPlan_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantNinetyDayGrowthPlan" ADD CONSTRAINT "MerchantNinetyDayGrowthPlan_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
