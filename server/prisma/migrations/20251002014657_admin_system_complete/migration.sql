-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('WELCOME_BONUS', 'STANDARD', 'PREMIUM', 'REFERRAL_BONUS');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'FROZEN');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WithdrawalType" AS ENUM ('FIRST_WITHDRAWAL', 'REGULAR_WITHDRAWAL', 'EMERGENCY_WITHDRAWAL');

-- CreateEnum
CREATE TYPE "ReferralEarningType" AS ENUM ('SIGNUP_BONUS', 'DEPOSIT_COMMISSION', 'EARNINGS_COMMISSION', 'ACTIVITY_BONUS');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FreezeReason" AS ENUM ('INACTIVITY', 'SUSPICIOUS_ACTIVITY', 'VIOLATION_TERMS', 'ADMIN_DECISION', 'SYSTEM_DETECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityLogType" ADD VALUE 'LOGIN';
ALTER TYPE "ActivityLogType" ADD VALUE 'LOGOUT';
ALTER TYPE "ActivityLogType" ADD VALUE 'INVESTMENT_CREATED';
ALTER TYPE "ActivityLogType" ADD VALUE 'INVESTMENT_COMPLETED';
ALTER TYPE "ActivityLogType" ADD VALUE 'WITHDRAWAL_REQUESTED';
ALTER TYPE "ActivityLogType" ADD VALUE 'WITHDRAWAL_APPROVED';
ALTER TYPE "ActivityLogType" ADD VALUE 'WITHDRAWAL_REJECTED';
ALTER TYPE "ActivityLogType" ADD VALUE 'REFERRAL_EARNED';
ALTER TYPE "ActivityLogType" ADD VALUE 'ACCOUNT_FROZEN';
ALTER TYPE "ActivityLogType" ADD VALUE 'ACCOUNT_UNFROZEN';
ALTER TYPE "ActivityLogType" ADD VALUE 'PASSWORD_CHANGED';
ALTER TYPE "ActivityLogType" ADD VALUE 'PROFILE_UPDATED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "firstWithdrawalAt" TIMESTAMP(3),
ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "frozenReason" TEXT,
ADD COLUMN     "hasMadeDeposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFrozen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "lastLotteryTicketAt" TIMESTAMP(3),
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "InvestmentType" NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "expectedReturn" DOUBLE PRECISION NOT NULL,
    "actualReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyRate" DOUBLE PRECISION NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "type" "WithdrawalType" NOT NULL,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT,
    "processedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralEarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "ReferralEarningType" NOT NULL,
    "level" INTEGER NOT NULL,
    "isCapped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPayout" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "processedUsers" INTEGER NOT NULL DEFAULT 0,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPayoutDetail" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "investmentId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPayoutDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountFreeze" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" "FreezeReason" NOT NULL,
    "duration" INTEGER,
    "frozenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unfrozenAt" TIMESTAMP(3),
    "adminId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AccountFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investment_userId_idx" ON "Investment"("userId");

-- CreateIndex
CREATE INDEX "Investment_status_idx" ON "Investment"("status");

-- CreateIndex
CREATE INDEX "Investment_endDate_idx" ON "Investment"("endDate");

-- CreateIndex
CREATE INDEX "Investment_isLocked_idx" ON "Investment"("isLocked");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_idx" ON "Withdrawal"("userId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- CreateIndex
CREATE INDEX "Withdrawal_createdAt_idx" ON "Withdrawal"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralEarning_userId_idx" ON "ReferralEarning"("userId");

-- CreateIndex
CREATE INDEX "ReferralEarning_sourceUserId_idx" ON "ReferralEarning"("sourceUserId");

-- CreateIndex
CREATE INDEX "ReferralEarning_type_idx" ON "ReferralEarning"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPayout_date_key" ON "DailyPayout"("date");

-- CreateIndex
CREATE INDEX "DailyPayout_date_idx" ON "DailyPayout"("date");

-- CreateIndex
CREATE INDEX "DailyPayout_status_idx" ON "DailyPayout"("status");

-- CreateIndex
CREATE INDEX "DailyPayoutDetail_payoutId_idx" ON "DailyPayoutDetail"("payoutId");

-- CreateIndex
CREATE INDEX "DailyPayoutDetail_userId_idx" ON "DailyPayoutDetail"("userId");

-- CreateIndex
CREATE INDEX "AccountFreeze_userId_idx" ON "AccountFreeze"("userId");

-- CreateIndex
CREATE INDEX "AccountFreeze_isActive_idx" ON "AccountFreeze"("isActive");

-- CreateIndex
CREATE INDEX "AccountFreeze_frozenAt_idx" ON "AccountFreeze"("frozenAt");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_isFrozen_idx" ON "User"("isFrozen");

-- CreateIndex
CREATE INDEX "User_activityScore_idx" ON "User"("activityScore");

-- CreateIndex
CREATE INDEX "User_lastActivityAt_idx" ON "User"("lastActivityAt");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEarning" ADD CONSTRAINT "ReferralEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPayoutDetail" ADD CONSTRAINT "DailyPayoutDetail_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "DailyPayout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountFreeze" ADD CONSTRAINT "AccountFreeze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
