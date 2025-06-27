-- Add missing columns to ProductReview table
ALTER TABLE "ProductReview" ADD COLUMN "reply" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "repliedAt" TIMESTAMP(3);
ALTER TABLE "ProductReview" ADD COLUMN "repliedById" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "adminReaction" TEXT;

-- Add foreign key constraint for repliedById
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; 