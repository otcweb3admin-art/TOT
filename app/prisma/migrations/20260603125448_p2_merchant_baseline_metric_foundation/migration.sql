-- CreateEnum
CREATE TYPE "BaselineDataConfidence" AS ENUM ('unknown', 'low', 'medium', 'high');

-- CreateTable
CREATE TABLE "MerchantBaselineMetric" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "periodLabel" TEXT,
    "monthlyRevenue" DECIMAL(14,2),
    "monthlyCustomerCount" INTEGER,
    "monthlyLeadCount" INTEGER,
    "monthlyConversionCount" INTEGER,
    "averageOrderValue" DECIMAL(12,2),
    "repeatCustomerRate" DECIMAL(5,2),
    "followerCount" INTEGER,
    "reviewCount" INTEGER,
    "averageRating" DECIMAL(3,2),
    "sourceNote" TEXT,
    "dataConfidence" "BaselineDataConfidence" NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantBaselineMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBaselineMetric_merchantId_key" ON "MerchantBaselineMetric"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantBaselineMetric" ADD CONSTRAINT "MerchantBaselineMetric_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBaselineMetric" ADD CONSTRAINT "MerchantBaselineMetric_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBaselineMetric" ADD CONSTRAINT "MerchantBaselineMetric_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
