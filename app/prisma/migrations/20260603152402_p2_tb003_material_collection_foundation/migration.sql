-- CreateEnum
CREATE TYPE "MaterialCollectionStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateTable
CREATE TABLE "MerchantMaterialCollection" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "MaterialCollectionStatus" NOT NULL DEFAULT 'draft',
    "materialCategorySummary" TEXT,
    "materialGapSummary" TEXT,
    "shootingSceneSummary" TEXT,
    "peopleMaterialSummary" TEXT,
    "productServiceMaterialSummary" TEXT,
    "trustMaterialSummary" TEXT,
    "brandStoryMaterialSummary" TEXT,
    "collectionPrioritySummary" TEXT,
    "collectionRiskSummary" TEXT,
    "notes" TEXT,
    "sourceAccountSetupId" TEXT,
    "createdByProfileId" TEXT NOT NULL,
    "updatedByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantMaterialCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantMaterialCollection_merchantId_key" ON "MerchantMaterialCollection"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantMaterialCollection" ADD CONSTRAINT "MerchantMaterialCollection_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantMaterialCollection" ADD CONSTRAINT "MerchantMaterialCollection_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantMaterialCollection" ADD CONSTRAINT "MerchantMaterialCollection_updatedByProfileId_fkey" FOREIGN KEY ("updatedByProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
