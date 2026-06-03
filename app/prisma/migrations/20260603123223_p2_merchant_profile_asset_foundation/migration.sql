-- CreateTable
CREATE TABLE "MerchantProfile" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "industryDetail" TEXT,
    "targetCustomerSummary" TEXT,
    "coreOfferSummary" TEXT,
    "currentAcquisitionSummary" TEXT,
    "onlinePresenceSummary" TEXT,
    "growthGoalSummary" TEXT,
    "executionLimitSummary" TEXT,
    "baselineDataSummary" TEXT,
    "notes" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_merchantId_key" ON "MerchantProfile"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
