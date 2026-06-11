-- CreateEnum
CREATE TYPE "WorkItemType" AS ENUM ('collector_intake', 'review_intake', 'ai_draft_review', 'outsource_execution', 'outsource_review', 'client_confirmation', 'general_followup');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('not_started', 'in_progress', 'submitted', 'changes_requested', 'approved', 'assigned', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "WorkItemPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "type" "WorkItemType" NOT NULL,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'not_started',
    "priority" "WorkItemPriority" NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "acceptanceCriteria" TEXT,
    "resultSummary" TEXT,
    "reviewNote" TEXT,
    "sourceNode" "MerchantStageNode",
    "targetNode" "MerchantStageNode",
    "assignedRole" "Role",
    "assignedProfileId" TEXT,
    "createdByProfileId" TEXT,
    "reviewerProfileId" TEXT,
    "requiresAi" BOOLEAN NOT NULL DEFAULT false,
    "requiresOutsource" BOOLEAN NOT NULL DEFAULT false,
    "requiresClientConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkItem_merchantId_idx" ON "WorkItem"("merchantId");

-- CreateIndex
CREATE INDEX "WorkItem_type_idx" ON "WorkItem"("type");

-- CreateIndex
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");

-- CreateIndex
CREATE INDEX "WorkItem_assignedRole_idx" ON "WorkItem"("assignedRole");

-- CreateIndex
CREATE INDEX "WorkItem_assignedProfileId_idx" ON "WorkItem"("assignedProfileId");

-- CreateIndex
CREATE INDEX "WorkItem_createdByProfileId_idx" ON "WorkItem"("createdByProfileId");

-- CreateIndex
CREATE INDEX "WorkItem_reviewerProfileId_idx" ON "WorkItem"("reviewerProfileId");

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_assignedProfileId_fkey" FOREIGN KEY ("assignedProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_reviewerProfileId_fkey" FOREIGN KEY ("reviewerProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
