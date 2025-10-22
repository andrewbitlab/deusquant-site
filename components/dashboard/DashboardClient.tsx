'use client'

import { useState, useMemo } from 'react'
import { StatsPanel } from './StatsPanel'
import { EquityCurve } from '../charts/EquityCurve'
import { StrategyTable } from './StrategyTable'
import { DateRangePicker, type DateRange, type QuickSelectPeriod } from './DateRangePicker'
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

  // Find min and max dates from all strategies
  const { minDate, maxDate } = useMemo(() => {
    let min = ''
    let max = ''

    for (const strategy of strategies) {
      for (const point of strategy.profitCurve) {
        if (!min || point.date < min) min = point.date
        if (!max || point.date > max) max = point.date
      }
    }

    return { minDate: min, maxDate: max }
  }, [strategies])

  // Date range state (initially set to MAX - full range)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: minDate,
    endDate: maxDate,
  })
  const [activePeriod, setActivePeriod] = useState<QuickSelectPeriod | null>('MAX')

  // Handle date range change
  const handleDateRangeChange = (newRange: DateRange, period?: QuickSelectPeriod) => {
    setDateRange(newRange)
    // Set active period if provided (from quick select), otherwise clear it (manual date entry)
    setActivePeriod(period || null)
  }

  // Calculate portfolio data based on selected strategies AND date range
  const portfolioData = useMemo(() => {
    const selected = strategies.filter((s) =>
      selectedIds.has(String(s.magicNumber))
    )

    if (selected.length === 0) {
      return {
        stats: [
          { label: 'Total Strategies', value: 0, format: 'number' as const },
          { label: 'Total Profit %', value: 0, format: 'percent' as const },
          { label: 'Max Drawdown %', value: 0, format: 'percent' as const },
          { label: 'Sharpe Ratio', value: 0, format: 'ratio' as const },
          { label: 'Calmar Ratio', value: 0, format: 'ratio' as const },
        ],
        profitCurve: [],
        normalizedProfitCurve: [],
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
    let maxDrawdownDollars = 0
    for (const point of portfolioEquityCurve) {
      if (point.profit > maxProfit) {
        maxProfit = point.profit
      }
      point.drawdown = maxProfit - point.profit
      if (point.drawdown > maxDrawdownDollars) {
        maxDrawdownDollars = point.drawdown
      }
    }

    // Step 4: Calculate initial capital based on max DD = 20% rule
    // If max DD = 20% of capital, then: capital = max DD / 0.20
    const MAX_DD_PERCENT = 20
    const realInitialCapital = maxDrawdownDollars > 0 ? maxDrawdownDollars / (MAX_DD_PERCENT / 100) : 1000 * selected.length

    // Step 5: Filter by date range
    const filteredCurve = portfolioEquityCurve.filter(
      (p) => p.date >= dateRange.startDate && p.date <= dateRange.endDate
    )

    if (filteredCurve.length === 0) {
      return {
        stats: [
          { label: 'Total Strategies', value: selected.length, format: 'number' as const },
          { label: 'Total Profit %', value: 0, format: 'percent' as const },
          { label: 'Max Drawdown %', value: 0, format: 'percent' as const },
          { label: 'Sharpe Ratio', value: 0, format: 'ratio' as const },
          { label: 'Calmar Ratio', value: 0, format: 'ratio' as const },
        ],
        profitCurve: [],
        normalizedProfitCurve: [],
        forwardTestStartDate: undefined,
      }
    }

    // Step 6: Calculate percentage metrics for filtered period based on real capital
    const startProfit = filteredCurve[0].profit
    const endProfit = filteredCurve[filteredCurve.length - 1].profit
    const startEquity = realInitialCapital + startProfit
    const endEquity = realInitialCapital + endProfit

    // Total Profit % = (end equity - start equity) / start equity * 100
    const totalProfitPercent = ((endEquity - startEquity) / startEquity) * 100

    // Recalculate drawdown for filtered period (from peak in THIS period)
    let peak = startEquity
    let maxDD = 0
    let maxDDPercent = 0

    // Create array to store drawdown for each point in filtered period
    const filteredDrawdowns: number[] = []

    for (const point of filteredCurve) {
      const equity = realInitialCapital + point.profit
      if (equity > peak) peak = equity
      const dd = peak - equity

      filteredDrawdowns.push(dd)

      if (dd > maxDD) maxDD = dd
    }

    // Calculate max DD % relative to start equity (not peak)
    // This gives us absolute percentage points of drawdown
    maxDDPercent = (maxDD / startEquity) * 100

    // Step 7: Normalize curve to start at 0% (for chart display)
    // Convert all values to percentage terms based on start equity
    const normalizedCurve = filteredCurve.map((point, index) => {
      const equity = realInitialCapital + point.profit
      const normalizedPercent = ((equity - startEquity) / startEquity) * 100
      // Use drawdown calculated for THIS filtered period, relative to start equity
      const drawdownPercent = (filteredDrawdowns[index] / startEquity) * 100
      return {
        date: point.date,
        profit: normalizedPercent,
        drawdown: drawdownPercent,
      }
    })

    // Step 8: Calculate metrics
    if (filteredCurve.length < 2) {
      return {
        stats: [
          { label: 'Total Strategies', value: selected.length, format: 'number' as const },
          { label: 'Total Profit %', value: totalProfitPercent, format: 'percent' as const },
          { label: 'Max Drawdown %', value: maxDDPercent, format: 'percent' as const },
          { label: 'Sharpe Ratio', value: 0, format: 'ratio' as const },
          { label: 'Calmar Ratio', value: 0, format: 'ratio' as const },
        ],
        profitCurve: filteredCurve,
        normalizedProfitCurve: normalizedCurve,
        forwardTestStartDate: undefined,
      }
    }

    // Calculate time period for filtered range
    const firstDate = new Date(filteredCurve[0].date)
    const lastDate = new Date(filteredCurve[filteredCurve.length - 1].date)
    const yearsElapsed = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // Annualized return (CAGR) based on percentage gain
    const annualizedReturn = yearsElapsed > 0
      ? (Math.pow(1 + totalProfitPercent / 100, 1 / yearsElapsed) - 1) * 100
      : totalProfitPercent

    // Calmar Ratio = Annualized Return % / Max Drawdown %
    const calmarRatio = maxDDPercent > 0 ? annualizedReturn / maxDDPercent : 0

    // Calculate Sharpe Ratio from daily returns of filtered portfolio equity
    const dailyReturns: number[] = []
    for (let i = 1; i < filteredCurve.length; i++) {
      const prevEquity = realInitialCapital + filteredCurve[i - 1].profit
      const currEquity = realInitialCapital + filteredCurve[i].profit
      const dailyReturn = (currEquity - prevEquity) / prevEquity
      dailyReturns.push(dailyReturn)
    }

    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
    const stdDev = Math.sqrt(variance)
    const portfolioSharpe = stdDev > 0 ? (avgDailyReturn / stdDev) * Math.sqrt(252) : 0

    const stats = [
      { label: 'Total Strategies', value: selected.length, format: 'number' as const },
      { label: 'Total Profit %', value: totalProfitPercent, format: 'percent' as const },
      { label: 'Max Drawdown %', value: maxDDPercent, format: 'percent' as const },
      { label: 'Sharpe Ratio', value: portfolioSharpe, format: 'ratio' as const },
      { label: 'Calmar Ratio', value: calmarRatio, format: 'ratio' as const },
    ]

    // Determine forward test start date (earliest among selected strategies)
    const forwardTestStartDate = selected
      .filter((s) => s.forwardTestStartDate)
      .map((s) => s.forwardTestStartDate!)
      .sort()[0] // Get earliest date

    return {
      stats,
      profitCurve: filteredCurve,
      normalizedProfitCurve: normalizedCurve,
      forwardTestStartDate,
    }
  }, [strategies, selectedIds, dateRange])

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

      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        minDate={minDate}
        maxDate={maxDate}
        activePeriod={activePeriod}
      />

      <StatsPanel stats={portfolioData.stats} />

      <div className="card">
        <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
          Portfolio Profit Curve (%)
          {portfolioData.forwardTestStartDate && (
            <span className="ml-3 text-sm font-normal text-text-secondary">
              (Includes forward test data from {portfolioData.forwardTestStartDate})
            </span>
          )}
        </h2>
        <EquityCurve
          data={portfolioData.normalizedProfitCurve.map((p) => ({
            date: p.date,
            equity: p.profit, // Already in percentage terms, normalized to 0%
            drawdown: -p.drawdown, // Negative so it displays below axis
          }))}
          showDrawdown={true}
          forwardTestStartDate={portfolioData.forwardTestStartDate}
          isPercentage={true}
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
        DEUS QUANT Portfolio System v1.0.44 - Professional Trading Analytics
      </div>
    </div>
  )
}
