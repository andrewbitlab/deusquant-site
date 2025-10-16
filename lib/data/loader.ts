import { readFileSync } from 'fs'
import { join } from 'path'
import { MT5ExcelParser } from '../parsers/mt5/excel-parser'
import { ForwardCSVParser } from '../parsers/csv/forward-parser'
import type { MT5ParseResult } from '../parsers/mt5/types'
import type { ForwardTestData } from '../parsers/csv/forward-parser'
import {
  calculateStatistics,
  buildProfitCurve,
  calculateDrawdowns,
  normalizeProfitCurve,
  normalizeStatistics,
  type ProfitCurvePoint,
} from '../calculators/statistics'

/**
 * Load all backtest files from data directory
 */
export async function loadBacktests(): Promise<MT5ParseResult[]> {
  const dataDir = join(process.cwd(), 'data', 'backtest')
  const files = ['202501021.xlsx', '202501025.xlsx', '202501027.xlsx']

  const results: MT5ParseResult[] = []

  for (const filename of files) {
    try {
      const filePath = join(dataDir, filename)
      const buffer = readFileSync(filePath)
      const file = new File([buffer], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const result = await MT5ExcelParser.parseFile(file)

      if (result.success) {
        results.push(result.data)
      }
    } catch (error) {
      console.error(`Failed to load ${filename}:`, error)
    }
  }

  return results
}

/**
 * Load forward test data
 */
export async function loadForwardTests(): Promise<ForwardTestData | null> {
  try {
    const dataDir = join(process.cwd(), 'data', 'forward')
    const filePath = join(dataDir, 'orders-deusfund-sqx1-2_8-10-2025.csv')

    // Read CSV file content as string
    const csvContent = readFileSync(filePath, 'utf-8')

    // Parse CSV content (server-side)
    const result = ForwardCSVParser.parseCSVContent(csvContent)

    console.log(`Loaded forward tests: ${result.tradesByStrategy.size} strategies`)
    for (const [magic, transactions] of result.tradesByStrategy.entries()) {
      console.log(`  Strategy ${magic}: ${transactions.length} forward test transactions`)
    }

    return result
  } catch (error) {
    console.error('Failed to load forward tests:', error)
    return null
  }
}

/**
 * Get all strategies with combined backtest and forward data
 */
export interface StrategyData {
  magicNumber: number
  name: string
  symbol: string
  timeframe: string
  totalProfit: number
  totalTrades: number
  winRate: number
  profitFactor: number
  maxDrawdown: number // In dollars (normalized to $1000)
  maxDrawdownPercent: number // Percentage
  sharpeRatio: number
  profitCurve: ProfitCurvePoint[] // Profit curve (cumulative profit from $0)
  transactions: any[] // Raw transaction data for selection/combining
  hasForwardTest: boolean
  forwardTestStartDate?: string // ISO date string when forward test period begins
}

export async function getAllStrategies(): Promise<StrategyData[]> {
  const backtests = await loadBacktests()
  const forwardTestData = await loadForwardTests()
  const strategies: StrategyData[] = []

  // Create a map of forward test transactions by magic number
  const forwardTestsByMagic = forwardTestData?.tradesByStrategy || new Map()

  for (const backtest of backtests) {
    const backtestTransactions = backtest.transactions || []

    if (backtestTransactions.length === 0) {
      console.warn(`Strategy ${backtest.metadata.magicNumber} has no transactions`)
      continue
    }

    const magicNumber = backtest.metadata.magicNumber
    const initialBalance = backtestTransactions[0]?.balance || 10000

    // STEP 1: Analyze backtest volumes
    const backtestVolumes = backtestTransactions
      .filter(tx => tx.type === 'BUY' || tx.type === 'SELL')
      .map(tx => tx.volume)
    const avgBacktestVolume = backtestVolumes.reduce((sum, v) => sum + v, 0) / backtestVolumes.length

    // Calculate backtest-only statistics to get the scale factor
    const backtestStats = calculateStatistics(backtestTransactions, initialBalance)
    const targetDrawdown = 1000
    const backtestScaleFactor = backtestStats.maxDrawdown > 0 ? targetDrawdown / backtestStats.maxDrawdown : 1

    console.log(
      `Strategy ${magicNumber}: Backtest avg volume = ${avgBacktestVolume.toFixed(4)} lots, max DD = $${backtestStats.maxDrawdown.toFixed(2)}, scale factor = ${backtestScaleFactor.toFixed(4)}`
    )

    // STEP 2: Scale forward test transactions - BOTH volume AND profit
    const rawForwardTransactions = forwardTestsByMagic.get(magicNumber) || []
    const hasForwardTest = rawForwardTransactions.length > 0
    let forwardTestStartDate: string | undefined
    let scaledForwardTransactions: any[] = []

    if (hasForwardTest) {
      forwardTestStartDate = rawForwardTransactions[0].openTime.toISOString().split('T')[0]

      // Analyze forward test volumes
      const forwardVolumes = rawForwardTransactions.map(tx => tx.volume)
      const avgForwardVolume = forwardVolumes.reduce((sum, v) => sum + v, 0) / forwardVolumes.length

      // Calculate volume scale factor to match backtest position sizes
      const volumeScaleFactor = avgBacktestVolume / avgForwardVolume

      console.log(
        `Strategy ${magicNumber}: Forward avg volume = ${avgForwardVolume.toFixed(4)} lots → scaling by ${volumeScaleFactor.toFixed(4)} to match backtest`
      )

      // Scale BOTH volume and profit to match backtest position sizes
      scaledForwardTransactions = rawForwardTransactions.map((tx) => ({
        ...tx,
        volume: tx.volume * volumeScaleFactor, // Scale volume to match backtest
        profit: tx.profit * volumeScaleFactor, // Profit scales with volume
        commission: tx.commission * volumeScaleFactor,
        swap: tx.swap * volumeScaleFactor,
      }))

      console.log(
        `Strategy ${magicNumber}: Scaled ${scaledForwardTransactions.length} forward test transactions (volume + profit)`
      )
    }

    // STEP 3: Merge backtest (normalized) + forward test (scaled to match)
    const backtestNormalized = backtestTransactions.map((tx) => ({
      ...tx,
      profit: tx.profit * backtestScaleFactor,
      commission: tx.commission * backtestScaleFactor,
      swap: tx.swap * backtestScaleFactor,
    }))

    const allTransactions = [...backtestNormalized, ...scaledForwardTransactions].sort(
      (a, b) => a.openTime.getTime() - b.openTime.getTime()
    )

    // STEP 4: Calculate combined statistics (now position sizes are coherent)
    const stats = calculateStatistics(allTransactions, initialBalance)

    // Build profit curve (cumulative profit starting from $0)
    const rawProfitCurve = buildProfitCurve(allTransactions)
    const profitCurveWithDrawdowns = calculateDrawdowns(rawProfitCurve)

    // Since transactions are already scaled, max DD should be close to $1000
    // But we normalize again to ensure exactly $1000
    const actualScaleFactor = stats.maxDrawdown > 0 ? targetDrawdown / stats.maxDrawdown : 1

    const normalizedProfitCurve = normalizeProfitCurve(
      profitCurveWithDrawdowns,
      stats.maxDrawdown,
      targetDrawdown
    )

    // Normalize statistics
    const normalizedStats = normalizeStatistics(stats, actualScaleFactor)

    // Get symbol and timeframe from Excel metadata (these are metadata, not calculations)
    const symbol = backtest.summary.symbol || 'XAUUSD'
    const timeframe = backtest.summary.period || 'H1'

    strategies.push({
      magicNumber,
      name: `Strategy ${magicNumber}`,
      symbol,
      timeframe,
      totalProfit: normalizedStats.totalNetProfit,
      totalTrades: backtest.summary.totalTrades, // Use Excel position count
      winRate: backtest.summary.winRate, // Use Excel position-based winRate
      profitFactor: normalizedStats.profitFactor,
      maxDrawdown: targetDrawdown, // Normalized to $1000
      maxDrawdownPercent: normalizedStats.maxDrawdownPercent,
      sharpeRatio: normalizedStats.sharpeRatio,
      profitCurve: normalizedProfitCurve,
      transactions: allTransactions, // Include merged transactions for later combining
      hasForwardTest,
      forwardTestStartDate,
    })
  }

  return strategies
}
