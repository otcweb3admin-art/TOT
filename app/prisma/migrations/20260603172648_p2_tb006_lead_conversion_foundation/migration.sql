-- CreateEnum
CREATE TYPE "LeadConversionStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantLeadConversion" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "LeadConversionStatus" NOT NULL DEFAULT 'draft',
    "trafficPathSummary" TEXT,
    "conversionPathSummary" TEXT,
    "privateDomainSummary" TEXT,
    "campaignIdeaSummary" TEXT,
    "googleMapsActionSummary" TEXT,
    "paidTrafficTestSummary" TEXT,
    "p001ReadinessSummary" TEXT,
    "thirtyDayActionSummary" TEXT,
    "conversionRiskSummary" TEXT,
    "attributionMethodSummary" TEXT,
    "notes" TEXT,
    "sourceContentOperationId" TEXT,
    "sourceLivePlanningId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantLeadConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantLeadConversion_merchantId_key" ON "MerchantLeadConversion"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantLeadConversion" ADD CONSTRAINT "MerchantLeadConversion_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLeadConversion" ADD CONSTRAINT "MerchantLeadConversion_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLeadConversion" ADD CONSTRAINT "MerchantLeadConversion_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
