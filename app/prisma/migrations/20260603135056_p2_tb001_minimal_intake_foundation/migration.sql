-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantDiagnosis" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'draft',
    "diagnosisSummary" TEXT,
    "growthProblemSummary" TEXT,
    "opportunitySummary" TEXT,
    "riskSummary" TEXT,
    "recommendedNextStep" TEXT,
    "sourceProfileId" TEXT,
    "sourceBaselineMetricId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantDiagnosis_merchantId_key" ON "MerchantDiagnosis"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantDiagnosis" ADD CONSTRAINT "MerchantDiagnosis_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDiagnosis" ADD CONSTRAINT "MerchantDiagnosis_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDiagnosis" ADD CONSTRAINT "MerchantDiagnosis_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
