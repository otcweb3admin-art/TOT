-- CreateEnum
CREATE TYPE "LivePlanningStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantLivePlanning" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "LivePlanningStatus" NOT NULL DEFAULT 'draft',
    "feasibilitySummary" TEXT,
    "platformSummary" TEXT,
    "liveGoalSummary" TEXT,
    "liveFormatSummary" TEXT,
    "liveTopicSummary" TEXT,
    "liveFrequencySummary" TEXT,
    "hostPeopleRequirementSummary" TEXT,
    "readinessSummary" TEXT,
    "liveRiskSummary" TEXT,
    "notes" TEXT,
    "sourceContentOperationId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantLivePlanning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantLivePlanning_merchantId_key" ON "MerchantLivePlanning"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantLivePlanning" ADD CONSTRAINT "MerchantLivePlanning_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLivePlanning" ADD CONSTRAINT "MerchantLivePlanning_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLivePlanning" ADD CONSTRAINT "MerchantLivePlanning_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
