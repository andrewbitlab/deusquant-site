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
    lossSum: Math.abs(data.loss),
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
    lossSum: Math.abs(data.loss),
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
    lossSum: Math.abs(data.loss),
    netProfit: data.profit + data.loss,
  }))
}

/**
 * Calculate yearly distribution
 * Database already stores time in broker timezone (UTC+2)
 */
function calculateYearlyDistribution(trades: Transaction[]): import('../types/strategy-report').TimeDistribution[] {
  const yearlyData: { [year: number]: { entries: number; profit: number; loss: number } } = {}

  // Count entries and P&L by year
  for (const trade of trades) {
    const year = trade.openTime.getFullYear()
    if (!yearlyData[year]) {
      yearlyData[year] = { entries: 0, profit: 0, loss: 0 }
    }
    yearlyData[year].entries++
    if (trade.profit > 0) {
      yearlyData[year].profit += trade.profit
    } else {
      yearlyData[year].loss += trade.profit
    }
  }

  return Object.entries(yearlyData)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, data]) => ({
      label: year,
      value: parseInt(year),
      entryCount: data.entries,
      profitSum: data.profit,
      lossSum: Math.abs(data.loss),
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
  const yearlyDistribution = calculateYearlyDistribution(trades)

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
    yearlyDistribution,
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

/**
 * Calculate monthly returns from equity curve
 * Used for "Fixed Position Monthly Returns" table
 */
export function calculateMonthlyReturns(
  equityCurve: import('../types/strategy-report').EquityCurvePoint[],
  initialBalance: number
): import('../types/strategy-report').MonthlyReturnsData {
  if (equityCurve.length === 0) {
    return {
      years: [],
      avgMonthlyReturns: {
        months: Array(12).fill(0),
        mdd: 0,
      },
    }
  }

  // Group data points by year and month
  type MonthData = {
    startValue: number
    endValue: number
    minValue: number
    hasData: boolean
  }
  type YearData = { [month: number]: MonthData }
  const yearlyData: { [year: number]: YearData } = {}

  // Process each point in the equity curve
  for (let i = 0; i < equityCurve.length; i++) {
    const point = equityCurve[i]
    const date = new Date(point.date)
    const year = date.getFullYear()
    const month = date.getMonth() // 0-11

    if (!yearlyData[year]) {
      yearlyData[year] = {}
    }

    if (!yearlyData[year][month]) {
      yearlyData[year][month] = {
        startValue: point.balance,
        endValue: point.balance,
        minValue: point.balance,
        hasData: true,
      }
    } else {
      // Update end value and track minimum
      yearlyData[year][month].endValue = point.balance
      yearlyData[year][month].minValue = Math.min(yearlyData[year][month].minValue, point.balance)
    }
  }

  // Build yearly returns data
  const years: import('../types/strategy-report').YearlyReturns[] = []

  for (const [yearStr, yearData] of Object.entries(yearlyData)) {
    const year = parseInt(yearStr)
    const months: import('../types/strategy-report').MonthReturns[] = []

    let yearStartValue = initialBalance
    let yearEndValue = initialBalance
    let yearPeak = initialBalance
    let yearMinDD = 0

    // Find the actual start value for this year
    if (Object.keys(yearData).length > 0) {
      const firstMonth = Math.min(...Object.keys(yearData).map((m) => parseInt(m)))
      yearStartValue = yearData[firstMonth].startValue
    }

    // Build months array
    for (let month = 0; month < 12; month++) {
      if (yearData[month]) {
        const monthData = yearData[month]
        const monthReturn = ((monthData.endValue - monthData.startValue) / monthData.startValue) * 100

        months.push({
          month,
          return: monthReturn,
          hasData: true,
        })

        yearEndValue = monthData.endValue

        // Track drawdown within this year
        yearPeak = Math.max(yearPeak, monthData.endValue)
        const dd = ((monthData.minValue - yearPeak) / yearPeak) * 100
        yearMinDD = Math.min(yearMinDD, dd)
      } else {
        months.push({
          month,
          return: null,
          hasData: false,
        })
      }
    }

    // Calculate year total return
    const yearReturn = ((yearEndValue - yearStartValue) / yearStartValue) * 100

    years.push({
      year,
      months,
      yearReturn,
      yearMDD: yearMinDD,
    })
  }

  // Sort years (newest first)
  years.sort((a, b) => b.year - a.year)

  // Calculate average monthly returns across all years
  const monthlyAverages = Array(12).fill(0)
  const monthlyCounts = Array(12).fill(0)

  for (const yearData of years) {
    for (const monthData of yearData.months) {
      if (monthData.hasData && monthData.return !== null) {
        monthlyAverages[monthData.month] += monthData.return
        monthlyCounts[monthData.month]++
      }
    }
  }

  // Calculate averages
  for (let i = 0; i < 12; i++) {
    if (monthlyCounts[i] > 0) {
      monthlyAverages[i] = monthlyAverages[i] / monthlyCounts[i]
    }
  }

  // Calculate overall MDD
  let overallPeak = initialBalance
  let overallMDD = 0
  for (const point of equityCurve) {
    overallPeak = Math.max(overallPeak, point.balance)
    const dd = ((point.balance - overallPeak) / overallPeak) * 100
    overallMDD = Math.min(overallMDD, dd)
  }

  return {
    years,
    avgMonthlyReturns: {
      months: monthlyAverages,
      mdd: overallMDD,
    },
  }
}
