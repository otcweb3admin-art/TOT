-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('lead', 'active', 'paused', 'archived');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "city" TEXT,
    "country" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'lead',
    "ownerProfileId" TEXT NOT NULL,
    "createdByProfileId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Merchant_ownerProfileId_idx" ON "Merchant"("ownerProfileId");

-- CreateIndex
CREATE INDEX "Merchant_createdByProfileId_idx" ON "Merchant"("createdByProfileId");

-- CreateIndex
CREATE INDEX "Merchant_status_idx" ON "Merchant"("status");

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
