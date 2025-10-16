'use client'

import { useState, useMemo } from 'react'
import { StatsPanel } from './StatsPanel'
import { EquityCurve } from '../charts/EquityCurve'
import { StrategyTable } from './StrategyTable'
import type { StrategyData } from '@/lib/data/loader'
import type { ProfitCurvePoint } from '@/lib/calculators/statistics'
import {
  buildProfitCurve,
  calculateDrawdowns,
  calculateStatistics,
  normalizeProfitCurve,
} from '@/lib/calculators/statistics'

interface DashboardClientProps {
  strategies: StrategyData[]
}

export function DashboardClient({ strategies }: DashboardClientProps) {
  // Track selected strategy IDs (initially all selected)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(strategies.map((s) => String(s.magicNumber)))
  )

  // Calculate portfolio data based on selected strategies
  const portfolioData = useMemo(() => {
    const selected = strategies.filter((s) =>
      selectedIds.has(String(s.magicNumber))
    )

    if (selected.length === 0) {
      return {
        stats: [
          { label: 'Total Strategies', value: 0, format: 'number' as const },
          { label: 'Total Profit', value: 0, format: 'currency' as const },
          { label: 'Sharpe Ratio', value: 0, format: 'ratio' as const },
          { label: 'Calmar Ratio', value: 0, format: 'ratio' as const },
          { label: 'Max Drawdown', value: 0, format: 'currency' as const },
        ],
        profitCurve: [],
        forwardTestStartDate: undefined,
      }
    }

    // Build portfolio equity curve with carry-forward logic
    // Each strategy is already normalized to $1000 max DD

    // Step 1: Collect all unique dates from all strategies
    const allDates = new Set<string>()
    for (const strategy of selected) {
      for (const point of strategy.profitCurve) {
        allDates.add(point.date)
      }
    }

    const sortedDates = Array.from(allDates).sort()

    // Step 2: Build portfolio equity curve with carry-forward
    const portfolioEquityCurve: ProfitCurvePoint[] = []
    const lastKnownProfit = new Map<number, number>() // magicNumber -> last profit

    // Initialize all strategies with 0 profit
    for (const strategy of selected) {
      lastKnownProfit.set(strategy.magicNumber, 0)
    }

    for (const date of sortedDates) {
      // Update last known profit for strategies that have a point on this date
      for (const strategy of selected) {
        const point = strategy.profitCurve.find((p) => p.date === date)
        if (point) {
          lastKnownProfit.set(strategy.magicNumber, point.profit)
        }
      }

      // Sum all last known profits for portfolio equity on this date
      let portfolioProfit = 0
      for (const profit of lastKnownProfit.values()) {
        portfolioProfit += profit
      }

      portfolioEquityCurve.push({
        date,
        profit: portfolioProfit,
        drawdown: 0, // Will calculate below
      })
    }

    // Step 3: Calculate drawdowns on portfolio curve
    let maxProfit = 0
    let maxDrawdown = 0
    for (const point of portfolioEquityCurve) {
      if (point.profit > maxProfit) {
        maxProfit = point.profit
      }
      point.drawdown = maxProfit - point.profit
      if (point.drawdown > maxDrawdown) {
        maxDrawdown = point.drawdown
      }
    }

    // Step 4: Calculate Total Profit (sum of each strategy's final profit)
    const totalProfit = selected.reduce((sum, strategy) => {
      const finalProfit = strategy.profitCurve.length > 0
        ? strategy.profitCurve[strategy.profitCurve.length - 1].profit
        : 0
      return sum + finalProfit
    }, 0)

    // Step 5: Calculate metrics
    if (portfolioEquityCurve.length < 2) {
      return {
        stats: [
          { label: 'Total Strategies', value: selected.length, format: 'number' as const },
          { label: 'Total Profit', value: totalProfit, format: 'currency' as const },
          { label: 'Sharpe Ratio', value: 0, format: 'ratio' as const },
          { label: 'Calmar Ratio', value: 0, format: 'ratio' as const },
          { label: 'Max Drawdown', value: maxDrawdown, format: 'currency' as const },
        ],
        profitCurve: portfolioEquityCurve,
        forwardTestStartDate: undefined,
      }
    }

    // Calculate time period
    const firstDate = new Date(portfolioEquityCurve[0].date)
    const lastDate = new Date(portfolioEquityCurve[portfolioEquityCurve.length - 1].date)
    const yearsElapsed = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // Initial capital = $1000 per strategy (each normalized to $1000 max DD)
    const initialCapital = 1000 * selected.length

    // Annualized return (CAGR)
    const annualizedReturn = yearsElapsed > 0
      ? (Math.pow((initialCapital + totalProfit) / initialCapital, 1 / yearsElapsed) - 1) * 100
      : 0

    // Calmar Ratio = Annualized Return % / Max Drawdown %
    const maxDrawdownPercent = (maxDrawdown / initialCapital) * 100
    const calmarRatio = maxDrawdownPercent > 0 ? annualizedReturn / maxDrawdownPercent : 0

    // Calculate Sharpe Ratio from daily returns of portfolio equity
    const dailyReturns: number[] = []
    for (let i = 1; i < portfolioEquityCurve.length; i++) {
      const prevEquity = initialCapital + portfolioEquityCurve[i - 1].profit
      const currEquity = initialCapital + portfolioEquityCurve[i].profit
      const dailyReturn = (currEquity - prevEquity) / prevEquity
      dailyReturns.push(dailyReturn)
    }

    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
    const stdDev = Math.sqrt(variance)
    const portfolioSharpe = stdDev > 0 ? (avgDailyReturn / stdDev) * Math.sqrt(252) : 0

    const stats = [
      { label: 'Total Strategies', value: selected.length, format: 'number' as const },
      { label: 'Total Profit', value: totalProfit, format: 'currency' as const },
      { label: 'Sharpe Ratio', value: portfolioSharpe, format: 'ratio' as const },
      { label: 'Calmar Ratio', value: calmarRatio, format: 'ratio' as const },
      { label: 'Max Drawdown', value: maxDrawdown, format: 'currency' as const },
    ]

    // Determine forward test start date (earliest among selected strategies)
    const forwardTestStartDate = selected
      .filter((s) => s.forwardTestStartDate)
      .map((s) => s.forwardTestStartDate!)
      .sort()[0] // Get earliest date

    return {
      stats,
      profitCurve: portfolioEquityCurve,
      forwardTestStartDate,
    }
  }, [strategies, selectedIds])

  // Handle strategy selection change
  const handleSelectionChange = (selected: string[]) => {
    setSelectedIds(new Set(selected))
  }

  // Prepare table data
  const tableStrategies = strategies.map((s) => ({
    id: String(s.magicNumber),
    magicNumber: s.magicNumber,
    name: s.name,
    symbol: s.symbol,
    totalProfit: s.totalProfit,
    winRate: s.winRate,
    maxDrawdown: s.maxDrawdown, // Now in dollars
    sharpeRatio: s.sharpeRatio,
    hasForwardTest: s.hasForwardTest,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-deus-gray mb-2">
          Portfolio Dashboard
        </h1>
        <p className="text-text-secondary">
          {strategies.length} trading strategies loaded from backtest + live forward test (out of sample) data
        </p>
      </div>

      <StatsPanel stats={portfolioData.stats} />

      <div className="card">
        <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
          Portfolio Profit Curve
          {portfolioData.forwardTestStartDate && (
            <span className="ml-3 text-sm font-normal text-text-secondary">
              (Includes forward test data from {portfolioData.forwardTestStartDate})
            </span>
          )}
        </h2>
        <EquityCurve
          data={portfolioData.profitCurve.map((p) => ({
            date: p.date,
            equity: p.profit, // Use profit as equity for the chart
            drawdown: -p.drawdown, // Negative so it displays below $0 axis
          }))}
          showDrawdown={true}
          forwardTestStartDate={portfolioData.forwardTestStartDate}
        />
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
          Strategy Performance
        </h2>
        <StrategyTable
          strategies={tableStrategies}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      <div className="text-center text-sm text-text-muted py-8">
        DEUS QUANT Portfolio System v1.0.37 - Professional Trading Analytics
      </div>
    </div>
  )
}
