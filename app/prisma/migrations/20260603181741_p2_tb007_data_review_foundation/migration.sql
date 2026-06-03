-- CreateEnum
CREATE TYPE "DataReviewStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantDataReview" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "DataReviewStatus" NOT NULL DEFAULT 'draft',
    "reviewPeriodLabel" TEXT,
    "goalCompletionSummary" TEXT,
    "contentEffectSummary" TEXT,
    "liveEffectSummary" TEXT,
    "leadConversionEffectSummary" TEXT,
    "realBusinessDataSummary" TEXT,
    "problemDiagnosisSummary" TEXT,
    "optimizationSuggestionSummary" TEXT,
    "strategyJudgmentSummary" TEXT,
    "attributionObservationSummary" TEXT,
    "reviewRiskSummary" TEXT,
    "notes" TEXT,
    "sourceBaselineMetricId" TEXT,
    "sourceContentOperationId" TEXT,
    "sourceLivePlanningId" TEXT,
    "sourceLeadConversionId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantDataReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantDataReview_merchantId_key" ON "MerchantDataReview"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantDataReview" ADD CONSTRAINT "MerchantDataReview_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDataReview" ADD CONSTRAINT "MerchantDataReview_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDataReview" ADD CONSTRAINT "MerchantDataReview_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
