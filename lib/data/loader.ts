import { isDatabaseConfigured, prisma } from './prisma'
import {
  calculateStatistics,
  buildProfitCurve,
  calculateDrawdowns,
  normalizeProfitCurve,
  normalizeStatistics,
  type ProfitCurvePoint,
} from '../calculators/statistics'
import type { MT5Transaction } from '../parsers/mt5/types'
import type { Transaction } from '@prisma/client'

// Convert Prisma Transaction to MT5Transaction format
function toMT5Transaction(tx: Transaction): MT5Transaction {
  return {
    id: tx.orderId, // Use orderId as id (number)
    type: tx.type as 'BUY' | 'SELL' | 'BALANCE' | 'CREDIT',
    openTime: tx.openTime,
    closeTime: tx.closeTime ?? undefined,
    symbol: tx.symbol,
    volume: tx.volume,
    openPrice: tx.openPrice,
    closePrice: tx.closePrice ?? undefined,
    sl: tx.sl ?? undefined,
    tp: tx.tp ?? undefined,
    commission: tx.commission,
    swap: tx.swap,
    profit: tx.profit,
    balance: tx.balance ?? undefined,
    comment: tx.comment ?? undefined,
  }
}

/**
 * Get all strategies with combined backtest and forward data from database
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
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured')
  }

  try {
    // Query all strategies with their transactions from database
    const dbStrategies = await prisma.strategy.findMany({
      where: {
        isActive: true,
      },
      include: {
        Transaction: {
          orderBy: {
            openTime: 'asc',
          },
        },
      },
    })

  const strategies: StrategyData[] = []

  for (const dbStrategy of dbStrategies) {
    const transactions = dbStrategy.Transaction

    if (transactions.length === 0) {
      console.warn(`Strategy ${dbStrategy.magicNumber} has no transactions`)
      continue
    }

    // Separate backtest and forward test transactions and convert to MT5 format
    const backtestTransactions = transactions.filter(tx => !tx.isForwardTest).map(toMT5Transaction)
    const forwardTransactions = transactions.filter(tx => tx.isForwardTest).map(toMT5Transaction)

    const hasForwardTest = forwardTransactions.length > 0
    const forwardTestStartDate = hasForwardTest
      ? forwardTransactions[0].openTime.toISOString().split('T')[0]
      : undefined

    const magicNumber = dbStrategy.magicNumber
    const initialBalance = backtestTransactions[0]?.balance || 10000

    // STEP 1: Analyze backtest volumes
    const backtestVolumes = backtestTransactions
      .filter(tx => tx.type === 'BUY' || tx.type === 'SELL')
      .map(tx => tx.volume)

    if (backtestVolumes.length === 0) {
      console.warn(`Strategy ${magicNumber} has no backtest trade volumes`)
      continue
    }

    const avgBacktestVolume = backtestVolumes.reduce((sum, v) => sum + v, 0) / backtestVolumes.length

    // Calculate backtest-only statistics to get the scale factor
    const backtestStats = calculateStatistics(backtestTransactions, initialBalance)
    const targetDrawdown = 1000
    const backtestScaleFactor = backtestStats.maxDrawdown > 0 ? targetDrawdown / backtestStats.maxDrawdown : 1

    console.log(
      `Strategy ${magicNumber}: Backtest avg volume = ${avgBacktestVolume.toFixed(4)} lots, max DD = $${backtestStats.maxDrawdown.toFixed(2)}, scale factor = ${backtestScaleFactor.toFixed(4)}`
    )

    // STEP 2: Scale forward test transactions - BOTH volume AND profit
    let scaledForwardTransactions: any[] = []

    if (hasForwardTest) {
      // Analyze forward test volumes
      const forwardVolumes = forwardTransactions.map(tx => tx.volume)
      const avgForwardVolume = forwardVolumes.reduce((sum, v) => sum + v, 0) / forwardVolumes.length

      // Calculate volume scale factor to match backtest position sizes
      const volumeScaleFactor = avgBacktestVolume / avgForwardVolume

      console.log(
        `Strategy ${magicNumber}: Forward avg volume = ${avgForwardVolume.toFixed(4)} lots → scaling by ${volumeScaleFactor.toFixed(4)} to match backtest`
      )

      // Scale BOTH volume and profit to match backtest position sizes
      scaledForwardTransactions = forwardTransactions.map(tx => ({
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
    const backtestNormalized = backtestTransactions.map(tx => ({
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

    // Use calculated statistics (these are based on actual transactions)
    const totalTrades = stats.totalTrades
    const winRate = stats.winRate

    strategies.push({
      magicNumber,
      name: dbStrategy.name,
      symbol: dbStrategy.symbol,
      timeframe: dbStrategy.timeframe,
      totalProfit: normalizedStats.totalNetProfit,
      totalTrades, // Use Excel position count from stored metrics
      winRate, // Use Excel position-based winRate from stored metrics
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

    console.log(`Loaded ${strategies.length} strategies from database`)

    return strategies
  } catch (error) {
    console.error('Failed to load strategies from database:', error)
    throw new Error(
      `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
