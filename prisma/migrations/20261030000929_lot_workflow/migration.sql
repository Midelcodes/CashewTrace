-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "detail" TEXT;

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "dryingStartedAt" TIMESTAMP(3),
ADD COLUMN     "moistureBefore" DECIMAL(5,2),
ADD COLUMN     "rejectionReason" TEXT;
