/**
 * Strategy Report Data Loader
 * Loads comprehensive report data for a single strategy
 * Hybrid approach: Database (transactions) + HTML parsing (advanced metrics)
 */

import { prisma } from './prisma'
import { parseMT5HTMLReport, getChartImagePaths } from '../parsers/mt5-html-parser'
import {
  calculateStatistics,
  buildProfitCurve,
  calculateDrawdowns,
} from '../calculators/statistics'
import type {
  StrategyReportData,
  ChartData,
  EquityCurvePoint,
  DrawdownPoint,
  DistributionBin,
  HoldingTimeBin,
  TradesSummary,
} from '../types/strategy-report'
import type { Transaction } from '@prisma/client'

/**
 * Load complete strategy report data
 */
export async function loadStrategyReport(magicNumber: string): Promise<StrategyReportData> {
  // 1. Load strategy and transactions from database (backtest only)
  const strategy = await prisma.strategy.findUnique({
    where: { magicNumber: parseInt(magicNumber) },
    include: {
      Transaction: {
        where: { isForwardTest: false },
        orderBy: { openTime: 'asc' },
      },
    },
  })

  if (!strategy) {
    throw new Error(`Strategy ${magicNumber} not found`)
  }

  // 2. Parse HTML report for advanced metrics
  const htmlData = await parseMT5HTMLReport(magicNumber)

  // 3. Calculate chart data from transactions (pass all transactions for MAE/MFE)
  const charts = calculateChartData(strategy.Transaction)

  // 4. Build trades summary
  const tradesSummary = buildTradesSummary(strategy.Transaction)

  // 5. Combine all data
  return {
    strategyInfo: htmlData.strategyInfo,
    settings: htmlData.settings,
    metrics: htmlData.metrics,
    charts,
    tradesSummary,
  }
}

/**
 * Calculate hourly distribution of trades and P&L
 * Database already stores time in broker timezone (UTC+2)
 */
function calculateHourlyDistribution(trades: Transaction[]): import('../types/strategy-report').TimeDistribution[] {
  const hourlyData: { [hour: number]: { entries: number; profit: number; loss: number } } = {}

  // Initialize all 24 hours
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { entries: 0, profit: 0, loss: 0 }
  }

  // Count entries and P&L by hour
  for (const trade of trades) {
    const hour = trade.openTime.getHours()
    hourlyData[hour].entries++
    if (trade.profit > 0) {
      hourlyData[hour].profit += trade.profit
    } else {
      hourlyData[hour].loss += trade.profit
    }
  }

  return Object.entries(hourlyData).map(([hour, data]) => ({
    label: hour.toString().padStart(2, '0'),
    value: parseInt(hour),
    entryCount: data.entries,
    profitSum: data.profit,
    lossSum: data.loss,
    netProfit: data.profit + data.loss,
  }))
}

/**
 * Calculate daily distribution (by day of week)
 * Database already stores time in broker timezone (UTC+2)
 */
function calculateDailyDistribution(trades: Transaction[]): import('../types/strategy-report').TimeDistribution[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dailyData: { [day: number]: { entries: number; profit: number; loss: number } } = {}

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    dailyData[i] = { entries: 0, profit: 0, loss: 0 }
  }

  // Count entries and P&L by day of week
  for (const trade of trades) {
    const day = trade.openTime.getDay()
    dailyData[day].entries++
    if (trade.profit > 0) {
      dailyData[day].profit += trade.profit
    } else {
      dailyData[day].loss += trade.profit
    }
  }

  return Object.entries(dailyData).map(([day, data]) => ({
    label: dayNames[parseInt(day)],
    value: parseInt(day),
    entryCount: data.entries,
    profitSum: data.profit,
    lossSum: data.loss,
    netProfit: data.profit + data.loss,
  }))
}

/**
 * Calculate monthly distribution
 * Database already stores time in broker timezone (UTC+2)
 */
function calculateMonthlyDistribution(trades: Transaction[]): import('../types/strategy-report').TimeDistribution[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData: { [month: number]: { entries: number; profit: number; loss: number } } = {}

  // Initialize all 12 months
  for (let i = 0; i < 12; i++) {
    monthlyData[i] = { entries: 0, profit: 0, loss: 0 }
  }

  // Count entries and P&L by month
  for (const trade of trades) {
    const month = trade.openTime.getMonth()
    monthlyData[month].entries++
    if (trade.profit > 0) {
      monthlyData[month].profit += trade.profit
    } else {
      monthlyData[month].loss += trade.profit
    }
  }

  return Object.entries(monthlyData).map(([month, data]) => ({
    label: monthNames[parseInt(month)],
    value: parseInt(month),
    entryCount: data.entries,
    profitSum: data.profit,
    lossSum: data.loss,
    netProfit: data.profit + data.loss,
  }))
}

/**
 * Calculate holding time scatter data (profit vs holding time)
 */
function calculateHoldingTimeScatter(trades: Transaction[]): import('../types/strategy-report').HoldingTimePoint[] {
  const scatterData: import('../types/strategy-report').HoldingTimePoint[] = []

  for (const trade of trades) {
    if (trade.closeTime && trade.openTime) {
      const durationMs = trade.closeTime.getTime() - trade.openTime.getTime()
      const holdingTimeHours = durationMs / (1000 * 60 * 60)

      scatterData.push({
        tradeId: trade.orderId,
        profit: trade.profit,
        holdingTimeHours,
        openTime: trade.openTime.toISOString(),
        closeTime: trade.closeTime.toISOString(),
      })
    }
  }

  return scatterData
}

/**
 * Calculate chart data from transactions
 */
function calculateChartData(transactions: Transaction[]): ChartData {
  // Filter only trade transactions (BUY/SELL)
  const trades = transactions.filter(tx => tx.type === 'BUY' || tx.type === 'SELL')

  // Calculate equity curve
  const equityCurve: EquityCurvePoint[] = []
  let cumulativeProfit = 0
  const initialBalance = transactions[0]?.balance || 10000

  for (const tx of transactions) {
    if (tx.type === 'BUY' || tx.type === 'SELL') {
      cumulativeProfit += tx.profit + tx.commission + tx.swap

      equityCurve.push({
        date: tx.closeTime?.toISOString() || tx.openTime.toISOString(),
        balance: initialBalance + cumulativeProfit,
        equity: initialBalance + cumulativeProfit, // Simplified: assume closed trades
      })
    }
  }

  // Calculate drawdown curve
  const drawdown: DrawdownPoint[] = []
  let peak = initialBalance
  for (const point of equityCurve) {
    if (point.balance > peak) {
      peak = point.balance
    }
    const dd = point.balance - peak
    const ddPercent = peak > 0 ? (dd / peak) * 100 : 0

    drawdown.push({
      date: point.date,
      drawdown: dd,
      drawdownPercent: ddPercent,
    })
  }

  // Calculate profit distribution
  const profitDistribution = calculateProfitDistribution(trades)

  // Calculate holding time distribution
  const holdingTime = calculateHoldingTimeDistribution(trades)

  // Calculate time-based distributions
  const hourlyDistribution = calculateHourlyDistribution(trades)
  const dailyDistribution = calculateDailyDistribution(trades)
  const monthlyDistribution = calculateMonthlyDistribution(trades)

  // Calculate holding time scatter data
  const holdingTimeScatter = calculateHoldingTimeScatter(trades)

  return {
    equityCurve,
    drawdown,
    profitDistribution,
    holdingTime,
    hourlyDistribution,
    dailyDistribution,
    monthlyDistribution,
    holdingTimeScatter,
  }
}

/**
 * Calculate profit distribution histogram
 */
function calculateProfitDistribution(trades: Transaction[]): DistributionBin[] {
  const profits = trades.map(tx => tx.profit)

  // Find min/max
  const minProfit = Math.min(...profits)
  const maxProfit = Math.max(...profits)

  // Create bins
  const binSize = Math.ceil((maxProfit - minProfit) / 20) // 20 bins
  const bins: DistributionBin[] = []

  for (let i = 0; i < 20; i++) {
    const rangeStart = minProfit + i * binSize
    const rangeEnd = rangeStart + binSize

    const count = profits.filter(p => p >= rangeStart && p < rangeEnd).length

    bins.push({
      rangeStart,
      rangeEnd,
      count,
      label: `$${Math.round(rangeStart)} to $${Math.round(rangeEnd)}`,
    })
  }

  return bins.filter(bin => bin.count > 0)
}

/**
 * Calculate holding time distribution
 */
function calculateHoldingTimeDistribution(trades: Transaction[]): HoldingTimeBin[] {
  const durations: number[] = []

  for (const tx of trades) {
    if (tx.closeTime && tx.openTime) {
      const durationMs = tx.closeTime.getTime() - tx.openTime.getTime()
      const durationMinutes = durationMs / (1000 * 60)
      durations.push(durationMinutes)
    }
  }

  // Define bins
  const bins: HoldingTimeBin[] = [
    { label: '< 1h', durationMinutes: 30, count: 0 },
    { label: '1-4h', durationMinutes: 150, count: 0 },
    { label: '4-24h', durationMinutes: 14 * 60, count: 0 },
    { label: '1-7d', durationMinutes: 4 * 24 * 60, count: 0 },
    { label: '> 7d', durationMinutes: 14 * 24 * 60, count: 0 },
  ]

  // Count durations into bins
  for (const duration of durations) {
    if (duration < 60) bins[0].count++
    else if (duration < 4 * 60) bins[1].count++
    else if (duration < 24 * 60) bins[2].count++
    else if (duration < 7 * 24 * 60) bins[3].count++
    else bins[4].count++
  }

  return bins.filter(bin => bin.count > 0)
}

/**
 * Build trades summary
 */
function buildTradesSummary(transactions: Transaction[]): TradesSummary {
  const trades = transactions.filter(tx => tx.type === 'BUY' || tx.type === 'SELL')

  const profitTrades = trades.filter(tx => tx.profit > 0)
  const lossTrades = trades.filter(tx => tx.profit < 0)

  const totalProfit = profitTrades.reduce((sum, tx) => sum + tx.profit, 0)
  const totalLoss = lossTrades.reduce((sum, tx) => sum + tx.profit, 0)

  const largestProfit = Math.max(...trades.map(tx => tx.profit))
  const largestLoss = Math.min(...trades.map(tx => tx.profit))

  const averageProfit = profitTrades.length > 0 ? totalProfit / profitTrades.length : 0
  const averageLoss = lossTrades.length > 0 ? totalLoss / lossTrades.length : 0

  const winRate = trades.length > 0 ? (profitTrades.length / trades.length) * 100 : 0

  return {
    totalTrades: trades.length,
    profitTrades: profitTrades.length,
    lossTrades: lossTrades.length,
    largestProfit,
    largestLoss,
    averageProfit,
    averageLoss,
    totalProfit,
    totalLoss,
    winRate,
  }
}

/**
 * Get chart image URLs for fallback display
 */
export function getChartImages(magicNumber: string) {
  return getChartImagePaths(magicNumber)
}
