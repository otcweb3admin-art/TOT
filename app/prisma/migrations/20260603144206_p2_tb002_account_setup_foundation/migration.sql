-- CreateEnum
CREATE TYPE "AccountSetupStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantAccountSetup" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "AccountSetupStatus" NOT NULL DEFAULT 'draft',
    "platformPlanSummary" TEXT,
    "accountPositioningSummary" TEXT,
    "namingDirection" TEXT,
    "bioDirection" TEXT,
    "visualDirectionSummary" TEXT,
    "personaDirectionSummary" TEXT,
    "googleMapsDirectionSummary" TEXT,
    "contactChannelSummary" TEXT,
    "setupRiskSummary" TEXT,
    "notes" TEXT,
    "sourceDiagnosisId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantAccountSetup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAccountSetup_merchantId_key" ON "MerchantAccountSetup"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantAccountSetup" ADD CONSTRAINT "MerchantAccountSetup_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAccountSetup" ADD CONSTRAINT "MerchantAccountSetup_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAccountSetup" ADD CONSTRAINT "MerchantAccountSetup_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
