-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "magicNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "version" TEXT DEFAULT '1.0.0',
    "backtestStart" TIMESTAMP(3) NOT NULL,
    "backtestEnd" TIMESTAMP(3) NOT NULL,
    "forwardStart" TIMESTAMP(3),
    "forwardEnd" TIMESTAMP(3),
    "backtestMetrics" TEXT NOT NULL,
    "forwardMetrics" TEXT,
    "combinedMetrics" TEXT,
    "backtestEquity" TEXT NOT NULL,
    "forwardEquity" TEXT,
    "combinedEquity" TEXT,
    "monthlyReturns" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKTEST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "closePrice" DOUBLE PRECISION,
    "sl" DOUBLE PRECISION,
    "tp" DOUBLE PRECISION,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3),
    "commission" DOUBLE PRECISION NOT NULL,
    "swap" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION,
    "comment" TEXT,
    "isForwardTest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rebalanceFreq" TEXT DEFAULT 'MONTHLY',
    "weightMethod" TEXT NOT NULL DEFAULT 'INVERSE_DD',
    "equityCurve" TEXT,
    "statistics" TEXT,
    "lastCalculated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioStrategy" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "customWeight" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_magicNumber_key" ON "Strategy"("magicNumber");

-- CreateIndex
CREATE INDEX "Strategy_symbol_timeframe_idx" ON "Strategy"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "Strategy_status_isActive_idx" ON "Strategy"("status", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_orderId_key" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_strategyId_openTime_idx" ON "Transaction"("strategyId", "openTime");

-- CreateIndex
CREATE INDEX "Transaction_symbol_idx" ON "Transaction"("symbol");

-- CreateIndex
CREATE INDEX "Portfolio_isPublic_idx" ON "Portfolio"("isPublic");

-- CreateIndex
CREATE INDEX "PortfolioStrategy_enabled_idx" ON "PortfolioStrategy"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioStrategy_portfolioId_strategyId_key" ON "PortfolioStrategy"("portfolioId", "strategyId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioStrategy" ADD CONSTRAINT "PortfolioStrategy_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioStrategy" ADD CONSTRAINT "PortfolioStrategy_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
