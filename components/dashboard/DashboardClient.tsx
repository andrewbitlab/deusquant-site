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
          { label: 'Sharpe Ratio', value: 0, format: 'number' as const },
          { label: 'Calmar Ratio', value: 0, format: 'number' as const },
        ],
        profitCurve: [],
        forwardTestStartDate: undefined,
      }
    }

    // Combine all transactions from selected strategies
    const allTransactions = selected.flatMap((s) => s.transactions)

    // Calculate combined statistics
    const combinedStats = calculateStatistics(allTransactions, 10000)

    // Build combined profit curve
    const rawProfitCurve = buildProfitCurve(allTransactions)
    const profitCurveWithDrawdowns = calculateDrawdowns(rawProfitCurve)

    // Normalize to max DD = $1000
    const normalizedCurve = normalizeProfitCurve(
      profitCurveWithDrawdowns,
      combinedStats.maxDrawdown,
      1000
    )

    // Calculate scale factor for stats
    const scaleFactor =
      combinedStats.maxDrawdown > 0 ? 1000 / combinedStats.maxDrawdown : 1

    const totalProfit = combinedStats.totalNetProfit * scaleFactor
    const avgWinRate =
      selected.reduce((sum, s) => sum + s.winRate, 0) / selected.length

    // Portfolio Sharpe Ratio (calculated on combined transactions)
    const portfolioSharpe = combinedStats.sharpeRatio

    // Calmar Ratio = Total Return / Max Drawdown
    const calmarRatio = combinedStats.maxDrawdown > 0
      ? Math.abs(combinedStats.totalNetProfit / combinedStats.maxDrawdown)
      : 0

    const stats = [
      { label: 'Total Strategies', value: selected.length, format: 'number' as const },
      { label: 'Total Profit', value: totalProfit, format: 'currency' as const },
      { label: 'Sharpe Ratio', value: portfolioSharpe, format: 'number' as const },
      { label: 'Calmar Ratio', value: calmarRatio, format: 'number' as const },
    ]

    // Determine forward test start date (earliest among selected strategies)
    const forwardTestStartDate = selected
      .filter((s) => s.forwardTestStartDate)
      .map((s) => s.forwardTestStartDate!)
      .sort()[0] // Get earliest date

    return {
      stats,
      profitCurve: normalizedCurve,
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
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-deus-gray mb-2">
          Portfolio Dashboard
        </h1>
        <p className="text-text-secondary">
          {strategies.length} trading strategies loaded from backtest data
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
            drawdown: p.drawdown,
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
        DEUS QUANT Portfolio System v1.0.0 - Professional Trading Analytics
      </div>
    </div>
  )
}
