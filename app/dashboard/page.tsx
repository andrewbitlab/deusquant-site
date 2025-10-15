import { DashboardHeader } from '@/components/dashboard/Header'
import { StatsPanel } from '@/components/dashboard/StatsPanel'
import { EquityCurve } from '@/components/charts/EquityCurve'
import { StrategyTable } from '@/components/dashboard/StrategyTable'
import { getAllStrategies } from '@/lib/data/loader'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Load all strategies from data directory
  const strategies = await getAllStrategies()

  // Calculate portfolio statistics
  const totalProfit = strategies.reduce((sum, s) => sum + s.totalProfit, 0)
  const totalTrades = strategies.reduce((sum, s) => sum + s.totalTrades, 0)
  const avgWinRate =
    strategies.reduce((sum, s) => sum + s.winRate, 0) / (strategies.length || 1)
  const avgSharpe =
    strategies.reduce((sum, s) => sum + s.sharpeRatio, 0) / (strategies.length || 1)

  const stats = [
    { label: 'Total Strategies', value: strategies.length, format: 'number' as const },
    { label: 'Total Profit', value: totalProfit, format: 'currency' as const },
    { label: 'Avg Win Rate', value: avgWinRate, format: 'percent' as const },
    { label: 'Avg Sharpe Ratio', value: avgSharpe, format: 'number' as const },
  ]

  // Combine equity curves for portfolio view (simple average for now)
  const allEquityPoints = strategies.flatMap((s) => s.equityCurve)
  const dateMap = new Map<string, { sum: number; count: number }>()

  allEquityPoints.forEach((point) => {
    const existing = dateMap.get(point.date) || { sum: 0, count: 0 }
    dateMap.set(point.date, {
      sum: existing.sum + point.equity,
      count: existing.count + 1,
    })
  })

  const portfolioEquity = Array.from(dateMap.entries())
    .map(([date, { sum, count }]) => ({
      date,
      equity: sum / count,
      drawdown: 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 100) // Limit to 100 points for performance

  // Prepare strategy table data
  const tableStrategies = strategies.map((s) => ({
    id: String(s.magicNumber),
    magicNumber: s.magicNumber,
    name: s.name,
    symbol: s.symbol,
    totalProfit: s.totalProfit,
    winRate: s.winRate,
    maxDrawdown: s.maxDrawdownPercent,
    sharpeRatio: s.sharpeRatio,
  }))

  return (
    <div className="min-h-screen bg-bg-secondary">
      <DashboardHeader />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-deus-gray mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-text-secondary">
            {strategies.length} trading strategies loaded from backtest data
          </p>
        </div>

        <StatsPanel stats={stats} />

        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
            Portfolio Equity Curve
          </h2>
          <EquityCurve data={portfolioEquity} />
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
            Strategy Performance
          </h2>
          <StrategyTable strategies={tableStrategies} />
        </div>

        <div className="text-center text-sm text-text-muted py-8">
          DEUS QUANT Portfolio System v1.0.0 - Professional Trading Analytics
        </div>
      </div>
    </div>
  )
}
