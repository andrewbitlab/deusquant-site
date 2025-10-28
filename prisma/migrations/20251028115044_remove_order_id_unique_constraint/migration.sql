-- DropIndex
DROP INDEX "Transaction_orderId_key";

-- CreateIndex
CREATE INDEX "Transaction_strategyId_orderId_idx" ON "Transaction"("strategyId", "orderId");
