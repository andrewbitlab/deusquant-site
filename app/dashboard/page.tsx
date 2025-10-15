import { DashboardHeader } from '@/components/dashboard/Header'
import { StatsPanel } from '@/components/dashboard/StatsPanel'
import { EquityCurve } from '@/components/charts/EquityCurve'
import { FileUploader } from '@/components/upload/FileUploader'

export default function DashboardPage() {
  // Sample data for demonstration
  const sampleStats = [
    { label: 'Total Strategies', value: 0, format: 'number' as const },
    { label: 'Total Profit', value: 0, format: 'currency' as const },
    { label: 'Win Rate', value: 0, format: 'percent' as const },
    { label: 'Sharpe Ratio', value: 0, format: 'number' as const },
  ]

  const sampleEquityData = [
    { date: '2023-01', equity: 1000, drawdown: 0 },
    { date: '2023-02', equity: 1050, drawdown: -20 },
    { date: '2023-03', equity: 1100, drawdown: 0 },
  ]

  return (
    <div className="min-h-screen bg-bg-secondary">
      <DashboardHeader />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-deus-gray mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-text-secondary">
            Professional algorithmic trading strategies analysis and portfolio management
          </p>
        </div>

        <StatsPanel stats={sampleStats} />

        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
            Upload Strategy Backtest
          </h2>
          <FileUploader />
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-4 text-deus-gray">
            Portfolio Equity Curve
          </h2>
          <EquityCurve data={sampleEquityData} />
        </div>

        <div className="text-center text-sm text-text-muted py-8">
          DEUS QUANT Portfolio System v1.0.0 - Professional Trading Analytics
        </div>
      </div>
    </div>
  )
}
