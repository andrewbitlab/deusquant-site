import { readFileSync } from 'fs'
import { join } from 'path'
import { MT5ExcelParser } from '../parsers/mt5/excel-parser'
import { ForwardCSVParser } from '../parsers/csv/forward-parser'
import type { MT5ParseResult } from '../parsers/mt5/types'
import type { ForwardTestData } from '../parsers/csv/forward-parser'

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
    const buffer = readFileSync(filePath)
    const file = new File([buffer], 'orders-deusfund-sqx1-2_8-10-2025.csv', {
      type: 'text/csv',
    })

    const result = await ForwardCSVParser.parseFile(file)
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
  maxDrawdown: number
  maxDrawdownPercent: number
  sharpeRatio: number
  equityCurve: Array<{ date: string; equity: number; drawdown?: number }>
  hasForwardTest: boolean
}

export async function getAllStrategies(): Promise<StrategyData[]> {
  const backtests = await loadBacktests()
  const strategies: StrategyData[] = []

  for (const backtest of backtests) {
    const equityCurve =
      backtest.dailyEquity?.map((point) => ({
        date: point.date.toISOString().split('T')[0],
        equity: point.equity,
        drawdown: 0, // Will calculate if needed
      })) || []

    strategies.push({
      magicNumber: backtest.metadata.magicNumber,
      name: `Strategy ${backtest.metadata.magicNumber}`,
      symbol: backtest.summary.symbol || 'XAUUSD',
      timeframe: backtest.summary.period || 'H1',
      totalProfit: backtest.summary.totalNetProfit,
      totalTrades: backtest.summary.totalTrades,
      winRate: backtest.summary.winRate,
      profitFactor: backtest.summary.profitFactor,
      maxDrawdown: backtest.summary.maximalDrawdown,
      maxDrawdownPercent: backtest.summary.maximalDrawdownPercent,
      sharpeRatio: backtest.summary.sharpeRatio || 0,
      equityCurve,
      hasForwardTest: false,
    })
  }

  return strategies
}
