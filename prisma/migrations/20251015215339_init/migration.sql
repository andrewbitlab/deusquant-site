-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "magicNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "version" TEXT DEFAULT '1.0.0',
    "backtestStart" DATETIME NOT NULL,
    "backtestEnd" DATETIME NOT NULL,
    "forwardStart" DATETIME,
    "forwardEnd" DATETIME,
    "backtestMetrics" TEXT NOT NULL,
    "forwardMetrics" TEXT,
    "combinedMetrics" TEXT,
    "backtestEquity" TEXT NOT NULL,
    "forwardEquity" TEXT,
    "combinedEquity" TEXT,
    "monthlyReturns" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKTEST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategyId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "volume" REAL NOT NULL,
    "openPrice" REAL NOT NULL,
    "closePrice" REAL,
    "sl" REAL,
    "tp" REAL,
    "openTime" DATETIME NOT NULL,
    "closeTime" DATETIME,
    "commission" REAL NOT NULL,
    "swap" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "balance" REAL,
    "comment" TEXT,
    "isForwardTest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rebalanceFreq" TEXT DEFAULT 'MONTHLY',
    "weightMethod" TEXT NOT NULL DEFAULT 'INVERSE_DD',
    "equityCurve" TEXT,
    "statistics" TEXT,
    "lastCalculated" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "PortfolioStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "customWeight" REAL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioStrategy_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PortfolioStrategy_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
