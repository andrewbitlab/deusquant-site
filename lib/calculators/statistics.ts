import type { MT5Transaction } from '../parsers/mt5/types'

/**
 * Complete Statistics Calculator
 * Calculates ALL metrics from transaction data only - no Excel reading
 */

export interface CalculatedStatistics {
  // Performance metrics
  totalNetProfit: number
  totalGrossProfit: number
  totalGrossLoss: number
  profitFactor: number
  expectedPayoff: number

  // Drawdown metrics (in dollars)
  maxDrawdown: number
  maxDrawdownPercent: number

  // Trade statistics
  totalTrades: number
  profitTrades: number
  lossTrades: number
  winRate: number

  // Risk metrics
  sharpeRatio: number

  // Trade extremes
  largestProfitTrade: number
  largestLossTrade: number
  averageProfitTrade: number
  averageLossTrade: number

  // Consecutive series
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  maxConsecutiveProfit: number
  maxConsecutiveLoss: number
}

export interface ProfitCurvePoint {
  date: string
  profit: number // Cumulative profit
  drawdown: number // Drawdown in dollars
}

/**
 * Build profit curve from transactions (daily aggregation)
 * Returns cumulative profit starting from $0
 */
export function buildProfitCurve(
  transactions: MT5Transaction[]
): Array<{ date: Date; profit: number }> {
  if (transactions.length === 0) return []

  // Sort transactions by time
  const sorted = [...transactions].sort(
    (a, b) => a.openTime.getTime() - b.openTime.getTime()
  )

  // Aggregate by date (daily snapshots)
  const dailyMap = new Map<string, number>()
  let cumulativeProfit = 0

  for (const tx of sorted) {
    // Skip balance/credit entries
    if (tx.type === 'BALANCE' || tx.type === 'CREDIT') continue

    // Add profit to cumulative
    cumulativeProfit += tx.profit

    // Get date string (YYYY-MM-DD)
    const dateStr = tx.openTime.toISOString().split('T')[0]

    // Update daily snapshot to latest cumulative value for that day
    dailyMap.set(dateStr, cumulativeProfit)
  }

  // Convert to array
  const profitCurve = Array.from(dailyMap.entries())
    .map(([dateStr, profit]) => ({
      date: new Date(dateStr),
      profit,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return profitCurve
}

/**
 * Calculate drawdown from profit curve
 * Returns array with profit and drawdown in dollars
 */
export function calculateDrawdowns(
  profitCurve: Array<{ date: Date; profit: number }>
): ProfitCurvePoint[] {
  if (profitCurve.length === 0) return []

  const result: ProfitCurvePoint[] = []
  let peak = 0

  for (const point of profitCurve) {
    // Update peak if we have a new high
    if (point.profit > peak) {
      peak = point.profit
    }

    // Calculate drawdown (how far below peak we are)
    const drawdown = peak - point.profit

    result.push({
      date: point.date.toISOString().split('T')[0],
      profit: point.profit,
      drawdown,
    })
  }

  return result
}

/**
 * Calculate all statistics from transactions
 */
export function calculateStatistics(
  transactions: MT5Transaction[],
  initialBalance: number = 10000
): CalculatedStatistics {
  // Filter out balance/credit entries to get only trades
  const trades = transactions.filter(
    (tx) => tx.type === 'BUY' || tx.type === 'SELL'
  )

  if (trades.length === 0) {
    return {
      totalNetProfit: 0,
      totalGrossProfit: 0,
      totalGrossLoss: 0,
      profitFactor: 0,
      expectedPayoff: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      totalTrades: 0,
      profitTrades: 0,
      lossTrades: 0,
      winRate: 0,
      sharpeRatio: 0,
      largestProfitTrade: 0,
      largestLossTrade: 0,
      averageProfitTrade: 0,
      averageLossTrade: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      maxConsecutiveProfit: 0,
      maxConsecutiveLoss: 0,
    }
  }

  // 1. Total Net Profit
  const totalNetProfit = trades.reduce((sum, tx) => sum + tx.profit, 0)

  // 2. Gross Profit / Loss
  const profitableTrades = trades.filter((tx) => tx.profit > 0)
  const losingTrades = trades.filter((tx) => tx.profit < 0)

  const totalGrossProfit = profitableTrades.reduce(
    (sum, tx) => sum + tx.profit,
    0
  )
  const totalGrossLoss = Math.abs(
    losingTrades.reduce((sum, tx) => sum + tx.profit, 0)
  )

  // 3. Profit Factor
  const profitFactor =
    totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : totalGrossProfit

  // 4. Expected Payoff
  const expectedPayoff = totalNetProfit / trades.length

  // 5. Trade counts
  const totalTrades = trades.length
  const profitTrades = profitableTrades.length
  const lossTrades = losingTrades.length
  const winRate = (profitTrades / totalTrades) * 100

  // 6. Calculate Max Drawdown from profit curve
  const profitCurve = buildProfitCurve(transactions)
  const curveWithDrawdowns = calculateDrawdowns(profitCurve)

  let maxDrawdown = 0
  for (const point of curveWithDrawdowns) {
    if (point.drawdown > maxDrawdown) {
      maxDrawdown = point.drawdown
    }
  }

  // Calculate max drawdown percentage based on peak equity
  let maxDrawdownPercent = 0
  if (curveWithDrawdowns.length > 0) {
    let peak = initialBalance
    for (const point of curveWithDrawdowns) {
      const equity = initialBalance + point.profit
      if (equity > peak) peak = equity
      const ddPercent = ((peak - equity) / peak) * 100
      if (ddPercent > maxDrawdownPercent) {
        maxDrawdownPercent = ddPercent
      }
    }
  }

  // 7. Largest trades
  const largestProfitTrade =
    profitableTrades.length > 0
      ? Math.max(...profitableTrades.map((tx) => tx.profit))
      : 0

  const largestLossTrade =
    losingTrades.length > 0
      ? Math.abs(Math.min(...losingTrades.map((tx) => tx.profit)))
      : 0

  // 8. Average trades
  const averageProfitTrade =
    profitableTrades.length > 0
      ? totalGrossProfit / profitableTrades.length
      : 0

  const averageLossTrade =
    losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0

  // 9. Consecutive wins/losses
  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxConsecutiveWins = 0
  let maxConsecutiveLosses = 0

  let currentProfitStreak = 0
  let currentLossAmount = 0
  let maxConsecutiveProfit = 0
  let maxConsecutiveLoss = 0

  for (const trade of trades) {
    if (trade.profit > 0) {
      // Win
      currentWinStreak++
      currentLossStreak = 0

      currentProfitStreak += trade.profit
      currentLossAmount = 0

      if (currentWinStreak > maxConsecutiveWins) {
        maxConsecutiveWins = currentWinStreak
      }
      if (currentProfitStreak > maxConsecutiveProfit) {
        maxConsecutiveProfit = currentProfitStreak
      }
    } else if (trade.profit < 0) {
      // Loss
      currentLossStreak++
      currentWinStreak = 0

      currentLossAmount += Math.abs(trade.profit)
      currentProfitStreak = 0

      if (currentLossStreak > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentLossStreak
      }
      if (currentLossAmount > maxConsecutiveLoss) {
        maxConsecutiveLoss = currentLossAmount
      }
    }
  }

  // 10. Sharpe Ratio (simplified - from monthly returns)
  const sharpeRatio = calculateSharpeRatio(trades, initialBalance)

  return {
    totalNetProfit,
    totalGrossProfit,
    totalGrossLoss,
    profitFactor,
    expectedPayoff,
    maxDrawdown,
    maxDrawdownPercent,
    totalTrades,
    profitTrades,
    lossTrades,
    winRate,
    sharpeRatio,
    largestProfitTrade,
    largestLossTrade,
    averageProfitTrade,
    averageLossTrade,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    maxConsecutiveProfit,
    maxConsecutiveLoss,
  }
}

/**
 * Calculate Sharpe Ratio from trades
 * Sharpe = (Average Return - Risk Free Rate) / Std Dev of Returns
 * Simplified: Using monthly returns, assuming 0 risk-free rate
 */
function calculateSharpeRatio(
  trades: MT5Transaction[],
  initialBalance: number
): number {
  if (trades.length === 0) return 0

  // Group trades by month
  const monthlyReturns = new Map<string, number>()

  for (const trade of trades) {
    const monthKey = `${trade.openTime.getFullYear()}-${String(
      trade.openTime.getMonth() + 1
    ).padStart(2, '0')}`

    const currentReturn = monthlyReturns.get(monthKey) || 0
    monthlyReturns.set(monthKey, currentReturn + trade.profit)
  }

  // Convert to percentage returns
  const returns = Array.from(monthlyReturns.values()).map(
    (profit) => (profit / initialBalance) * 100
  )

  if (returns.length < 2) return 0

  // Calculate average return
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length

  // Calculate standard deviation
  const squaredDiffs = returns.map((r) => Math.pow(r - avgReturn, 2))
  const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / returns.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return 0

  // Sharpe ratio (annualized)
  const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(12)

  return sharpeRatio
}

/**
 * Normalize profit curve so max drawdown = target amount (e.g., $1000)
 */
export function normalizeProfitCurve(
  profitCurve: ProfitCurvePoint[],
  maxDrawdown: number,
  targetDrawdown: number = 1000
): ProfitCurvePoint[] {
  if (profitCurve.length === 0 || maxDrawdown === 0) return profitCurve

  const scaleFactor = targetDrawdown / maxDrawdown

  return profitCurve.map((point) => ({
    date: point.date,
    profit: point.profit * scaleFactor,
    drawdown: point.drawdown * scaleFactor,
  }))
}

/**
 * Normalize statistics to match the normalized profit curve
 */
export function normalizeStatistics(
  stats: CalculatedStatistics,
  scaleFactor: number
): CalculatedStatistics {
  return {
    ...stats,
    totalNetProfit: stats.totalNetProfit * scaleFactor,
    totalGrossProfit: stats.totalGrossProfit * scaleFactor,
    totalGrossLoss: stats.totalGrossLoss * scaleFactor,
    expectedPayoff: stats.expectedPayoff * scaleFactor,
    maxDrawdown: stats.maxDrawdown * scaleFactor,
    // maxDrawdownPercent stays the same (it's a percentage)
    largestProfitTrade: stats.largestProfitTrade * scaleFactor,
    largestLossTrade: stats.largestLossTrade * scaleFactor,
    averageProfitTrade: stats.averageProfitTrade * scaleFactor,
    averageLossTrade: stats.averageLossTrade * scaleFactor,
    maxConsecutiveProfit: stats.maxConsecutiveProfit * scaleFactor,
    maxConsecutiveLoss: stats.maxConsecutiveLoss * scaleFactor,
  }
}
