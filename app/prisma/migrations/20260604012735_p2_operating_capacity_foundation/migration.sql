-- CreateEnum
CREATE TYPE "OperatingCapacityStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantOperatingCapacity" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "OperatingCapacityStatus" NOT NULL DEFAULT 'draft',
    "responseProcessSummary" TEXT,
    "responseTimeSummary" TEXT,
    "bookingProcessSummary" TEXT,
    "serviceCapacitySummary" TEXT,
    "peakHourHandlingSummary" TEXT,
    "fulfillmentRiskSummary" TEXT,
    "customerExperienceRiskSummary" TEXT,
    "ownerDependencySummary" TEXT,
    "staffRoleSummary" TEXT,
    "delegationReadinessSummary" TEXT,
    "standardProcessSummary" TEXT,
    "trainingReadinessSummary" TEXT,
    "organizationRiskSummary" TEXT,
    "operatingConstraintSummary" TEXT,
    "notes" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantOperatingCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOperatingCapacity_merchantId_key" ON "MerchantOperatingCapacity"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantOperatingCapacity" ADD CONSTRAINT "MerchantOperatingCapacity_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOperatingCapacity" ADD CONSTRAINT "MerchantOperatingCapacity_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOperatingCapacity" ADD CONSTRAINT "MerchantOperatingCapacity_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
