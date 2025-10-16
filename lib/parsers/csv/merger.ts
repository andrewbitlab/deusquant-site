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

    if (forward && forward.tradesByStrategy.size > 0) {
      transitionDate = forward.startDate

      // Start forward equity from last backtest equity value
      const lastBacktestEquity =
        backtestEquity[backtestEquity.length - 1]?.equity || 1000
      let runningEquity = lastBacktestEquity

      // Get all forward trades from all strategies
      const allForwardTrades: any[] = []
      Array.from(forward.tradesByStrategy.values()).forEach((trades) => {
        allForwardTrades.push(...trades)
      })
      allForwardTrades.sort((a, b) => a.openTime.getTime() - b.openTime.getTime())

      forwardEquity = allForwardTrades.map((trade) => {
        runningEquity += trade.profit
        return {
          date: trade.openTime,
          equity: runningEquity,
          isForward: true,
        }
      })
    }

    const combinedEquity = [...backtestEquity, ...forwardEquity]

    // Calculate forward test metrics
    let forwardTotalProfit = 0
    let forwardTotalTrades = 0
    if (forward) {
      Array.from(forward.tradesByStrategy.values()).forEach((trades) => {
        forwardTotalTrades += trades.length
        forwardTotalProfit += trades.reduce((sum, t) => sum + t.profit, 0)
      })
    }

    const totalProfit = backtest.summary.totalNetProfit + forwardTotalProfit
    const totalTrades = backtest.summary.totalTrades + forwardTotalTrades

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
