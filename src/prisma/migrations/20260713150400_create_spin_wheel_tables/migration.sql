-- CreateEnum
CREATE TYPE "SpinPrizeType" AS ENUM ('points', 'multiplier');

-- CreateTable
CREATE TABLE "spin_wheel_prizes" (
    "id" TEXT NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "type" "SpinPrizeType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "probabilityPercent" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" VARCHAR(100) NOT NULL,
    "updatedBy" VARCHAR(100) NOT NULL,

    CONSTRAINT "spin_wheel_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheel_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" VARCHAR(100) NOT NULL,

    CONSTRAINT "spin_wheel_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheel_spins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeId" TEXT,
    "rewardType" "SpinPrizeType" NOT NULL,
    "rewardValue" DECIMAL(10,2) NOT NULL,
    "spunAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_wheel_spins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spin_wheel_spins_userId_spunAt_idx" ON "spin_wheel_spins"("userId", "spunAt");

-- AddForeignKey
ALTER TABLE "spin_wheel_spins" ADD CONSTRAINT "spin_wheel_spins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_wheel_spins" ADD CONSTRAINT "spin_wheel_spins_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "spin_wheel_prizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
