-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ActivityLogType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'CLAIM', 'NEW_SLOT_PURCHASE', 'SLOT_EXTENSION', 'REFERRAL_SIGNUP_BONUS', 'REFERRAL_COMMISSION', 'REFERRAL_DEPOSIT_BONUS', 'TASK_REWARD', 'DAILY_BONUS', 'WELCOME_BONUS', 'REINVESTMENT', 'LEADERBOARD_BONUS', 'INVESTMENT_GROWTH_BONUS', 'DIVIDEND_BONUS', 'REFERRAL_3_IN_3_DAYS_BONUS', 'BALANCE_ZEROED_PENALTY', 'BALANCE_FROZEN_PENALTY', 'LOTTERY_TICKET_PURCHASE', 'LOTTERY_WIN', 'SWAP_USD_TO_MNE', 'EXCHANGE_RATE_CHANGE', 'ADMIN_LOTTERY_WIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "totalInvested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastDepositAt" TIMESTAMP(3),
    "lastWithdrawalAt" TIMESTAMP(3),
    "lastSlotPurchaseAt" TIMESTAMP(3),
    "captchaValidated" BOOLEAN NOT NULL DEFAULT false,
    "lastReferralZeroPenaltyAppliedAt" TIMESTAMP(3),
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "lastSuspiciousPenaltyAppliedAt" TIMESTAMP(3),
    "rank" TEXT,
    "lastInvestmentGrowthBonusClaimedAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "managedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiningSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccruedAt" TIMESTAMP(3) NOT NULL,
    "effectiveWeeklyRate" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'standard',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MiningSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" DOUBLE PRECISION NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedTask" (
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedTask_pkey" PRIMARY KEY ("userId","taskId")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityLogType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUserId" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lottery" (
    "id" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "jackpot" DOUBLE PRECISION NOT NULL,
    "isDrawn" BOOLEAN NOT NULL DEFAULT false,
    "winningNumbers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lottery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lotteryId" TEXT NOT NULL,
    "numbers" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "prizeAmount" DOUBLE PRECISION,
    "isAdminSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "USDAmount" DOUBLE PRECISION NOT NULL,
    "MNEAmount" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwapTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_lastSeenAt_idx" ON "User"("lastSeenAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isSuspicious_idx" ON "User"("isSuspicious");

-- CreateIndex
CREATE INDEX "User_totalInvested_idx" ON "User"("totalInvested");

-- CreateIndex
CREATE INDEX "User_isOnline_idx" ON "User"("isOnline");

-- CreateIndex
CREATE INDEX "User_managedBy_idx" ON "User"("managedBy");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "MiningSlot_userId_idx" ON "MiningSlot"("userId");

-- CreateIndex
CREATE INDEX "MiningSlot_isActive_idx" ON "MiningSlot"("isActive");

-- CreateIndex
CREATE INDEX "MiningSlot_expiresAt_idx" ON "MiningSlot"("expiresAt");

-- CreateIndex
CREATE INDEX "MiningSlot_createdAt_idx" ON "MiningSlot"("createdAt");

-- CreateIndex
CREATE INDEX "MiningSlot_type_idx" ON "MiningSlot"("type");

-- CreateIndex
CREATE INDEX "MiningSlot_userId_isActive_idx" ON "MiningSlot"("userId", "isActive");

-- CreateIndex
CREATE INDEX "MiningSlot_isLocked_idx" ON "MiningSlot"("isLocked");

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskId_key" ON "Task"("taskId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_type_idx" ON "ActivityLog"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_type_idx" ON "ActivityLog"("userId", "type");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LotteryTicket_userId_idx" ON "LotteryTicket"("userId");

-- CreateIndex
CREATE INDEX "LotteryTicket_lotteryId_idx" ON "LotteryTicket"("lotteryId");

-- CreateIndex
CREATE INDEX "SwapTransaction_userId_idx" ON "SwapTransaction"("userId");

-- CreateIndex
CREATE INDEX "SwapTransaction_createdAt_idx" ON "SwapTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "SwapTransaction_userId_createdAt_idx" ON "SwapTransaction"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningSlot" ADD CONSTRAINT "MiningSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedTask" ADD CONSTRAINT "CompletedTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedTask" ADD CONSTRAINT "CompletedTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryTicket" ADD CONSTRAINT "LotteryTicket_lotteryId_fkey" FOREIGN KEY ("lotteryId") REFERENCES "Lottery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryTicket" ADD CONSTRAINT "LotteryTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapTransaction" ADD CONSTRAINT "SwapTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

