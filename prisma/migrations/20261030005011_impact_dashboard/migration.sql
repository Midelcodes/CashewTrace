-- AlterTable
ALTER TABLE "BuyerInterest" ADD COLUMN     "contactedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "spoilageAvoidedFactor" DECIMAL(5,4) NOT NULL DEFAULT 0.05;
