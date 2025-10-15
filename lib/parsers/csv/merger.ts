import type { MT5ParseResult } from '../mt5/types'
import type { ForwardTestData } from './forward-parser'

export interface MergedStrategyData {
  magicNumber: number
  name: string
  backtestPeriod: { start: Date; end: Date }
  forwardPeriod?: { start: Date; end: Date }
  combinedMetrics: {
    totalTrades: number
    totalProfit: number
    profitFactor: number
    winRate: number
    maxDrawdown: number
    sharpeRatio: number
  }
  equityCurve: Array<{
    date: Date
    equity: number
    isForward: boolean
  }>
  transitionDate?: Date
}

/**
 * Backtest-Forward Merger
 * Merges backtest and forward test data into a unified view
 */
export class BacktestForwardMerger {
  static merge(
    backtest: MT5ParseResult,
    forward?: ForwardTestData
  ): MergedStrategyData {
    const backtestEquity =
      backtest.dailyEquity?.map((point) => ({
        date: point.date,
        equity: point.equity,
        isForward: false,
      })) || []

    let forwardEquity: Array<{ date: Date; equity: number; isForward: boolean }> = []
    let transitionDate: Date | undefined

    if (forward && forward.trades.length > 0) {
      transitionDate = forward.startDate

      // Start forward equity from last backtest equity value
      const lastBacktestEquity =
        backtestEquity[backtestEquity.length - 1]?.equity || 1000
      let runningEquity = lastBacktestEquity

      forwardEquity = forward.trades.map((trade) => {
        runningEquity += trade.profit
        return {
          date: trade.date,
          equity: runningEquity,
          isForward: true,
        }
      })
    }

    const combinedEquity = [...backtestEquity, ...forwardEquity]
    const totalProfit = backtest.summary.totalNetProfit + (forward?.totalProfit || 0)
    const totalTrades = backtest.summary.totalTrades + (forward?.totalTrades || 0)

    return {
      magicNumber: backtest.metadata.magicNumber,
      name: `Strategy ${backtest.metadata.magicNumber}`,
      backtestPeriod: {
        start:
          backtest.transactions[0]?.openTime || new Date(),
        end:
          backtest.transactions[backtest.transactions.length - 1]?.openTime ||
          new Date(),
      },
      forwardPeriod: forward
        ? { start: forward.startDate, end: forward.endDate }
        : undefined,
      combinedMetrics: {
        totalTrades,
        totalProfit,
        profitFactor: backtest.summary.profitFactor,
        winRate: backtest.summary.winRate,
        maxDrawdown: backtest.summary.maximalDrawdown,
        sharpeRatio: backtest.summary.sharpeRatio || 0,
      },
      equityCurve: combinedEquity,
      transitionDate,
    }
  }
}
