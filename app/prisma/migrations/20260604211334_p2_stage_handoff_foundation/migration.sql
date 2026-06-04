-- CreateEnum
CREATE TYPE "MerchantStageNode" AS ENUM ('merchant', 'profile', 'baseline', 'operating_capacity', 'diagnosis', 'account_setup', 'material_collection', 'content_operation', 'live_planning', 'lead_conversion', 'data_review', 'growth_plan', 'workspace');

-- CreateEnum
CREATE TYPE "MerchantStageHandoffStatus" AS ENUM ('submitted', 'received', 'cancelled');

-- CreateTable
CREATE TABLE "MerchantStageHandoff" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "fromNode" "MerchantStageNode" NOT NULL,
    "toNode" "MerchantStageNode" NOT NULL,
    "status" "MerchantStageHandoffStatus" NOT NULL DEFAULT 'submitted',
    "summary" TEXT,
    "gapSummary" TEXT,
    "riskSummary" TEXT,
    "evidenceSummary" TEXT,
    "submittedByProfileId" TEXT NOT NULL,
    "receivedByRole" "Role" NOT NULL,
    "receivedByProfileId" TEXT,
    "reviewedByProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "MerchantStageHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchantStageHandoff_merchantId_idx" ON "MerchantStageHandoff"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantStageHandoff" ADD CONSTRAINT "MerchantStageHandoff_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStageHandoff" ADD CONSTRAINT "MerchantStageHandoff_submittedByProfileId_fkey" FOREIGN KEY ("submittedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStageHandoff" ADD CONSTRAINT "MerchantStageHandoff_receivedByProfileId_fkey" FOREIGN KEY ("receivedByProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStageHandoff" ADD CONSTRAINT "MerchantStageHandoff_reviewedByProfileId_fkey" FOREIGN KEY ("reviewedByProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
