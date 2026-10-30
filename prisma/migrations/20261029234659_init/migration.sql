-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('YOUTH_18_35', 'ADULT_36_PLUS');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('RECEIVED', 'DRYING', 'TESTED', 'LISTED', 'RESERVED', 'SOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B', 'C', 'FAIL');

-- CreateEnum
CREATE TYPE "DryingMethod" AS ENUM ('SOLAR_PLATFORM', 'SOLAR_DRYER', 'TARPAULIN');

-- CreateTable
CREATE TABLE "Hub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "gender" "Gender" NOT NULL,
    "isYouth" BOOLEAN NOT NULL DEFAULT false,
    "hubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "farmerCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "community" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "farmSizeHa" DECIMAL(6,2) NOT NULL,
    "numberOfTrees" INTEGER,
    "cooperative" TEXT,
    "consentGiven" BOOLEAN NOT NULL,
    "hubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "harvestMonth" INTEGER NOT NULL,
    "bags" INTEGER NOT NULL,
    "weightKg" DECIMAL(10,2) NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityTest" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "moistureBefore" DECIMAL(5,2) NOT NULL,
    "moistureAfter" DECIMAL(5,2) NOT NULL,
    "korLbs" DECIMAL(5,2) NOT NULL,
    "nutCountPerKg" INTEGER,
    "defectivePct" DECIMAL(5,2),
    "grade" "Grade" NOT NULL,
    "dryingDays" INTEGER NOT NULL,
    "dryingMethod" "DryingMethod" NOT NULL DEFAULT 'SOLAR_PLATFORM',
    "testedById" TEXT NOT NULL,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerInterest" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "pricePerTonneNgn" DECIMAL(14,2) NOT NULL,
    "totalValueNgn" DECIMAL(14,2) NOT NULL,
    "commissionNgn" DECIMAL(14,2) NOT NULL,
    "farmerFeesNgn" DECIMAL(14,2) NOT NULL,
    "farmerPayoutNgn" DECIMAL(14,2) NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "farmGatePricePerTonneNgn" DECIMAL(14,2) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.02,
    "dryingTestFeePerBagNgn" DECIMAL(14,2) NOT NULL,
    "storageFeePerBagPerMonthNgn" DECIMAL(14,2) NOT NULL,
    "moistureMaxPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "gradeA_minKor" DECIMAL(5,2) NOT NULL DEFAULT 48,
    "gradeB_minKor" DECIMAL(5,2) NOT NULL DEFAULT 45,
    "gradeC_minKor" DECIMAL(5,2) NOT NULL DEFAULT 42,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hub_code_key" ON "Hub"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_phone_key" ON "Agent"("phone");

-- CreateIndex
CREATE INDEX "Agent_hubId_idx" ON "Agent"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_farmerCode_key" ON "Farmer"("farmerCode");

-- CreateIndex
CREATE INDEX "Farmer_hubId_idx" ON "Farmer"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_lotCode_key" ON "Lot"("lotCode");

-- CreateIndex
CREATE INDEX "Lot_farmerId_idx" ON "Lot"("farmerId");

-- CreateIndex
CREATE INDEX "Lot_hubId_idx" ON "Lot"("hubId");

-- CreateIndex
CREATE INDEX "Lot_status_idx" ON "Lot"("status");

-- CreateIndex
CREATE INDEX "Lot_season_idx" ON "Lot"("season");

-- CreateIndex
CREATE UNIQUE INDEX "QualityTest_lotId_key" ON "QualityTest"("lotId");

-- CreateIndex
CREATE INDEX "QualityTest_grade_idx" ON "QualityTest"("grade");

-- CreateIndex
CREATE INDEX "BuyerInterest_lotId_idx" ON "BuyerInterest"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_lotId_key" ON "Sale"("lotId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityTest" ADD CONSTRAINT "QualityTest_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityTest" ADD CONSTRAINT "QualityTest_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerInterest" ADD CONSTRAINT "BuyerInterest_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
