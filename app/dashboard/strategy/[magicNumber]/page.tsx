import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { loadStrategyReport, calculateMonthlyReturns } from '@/lib/data/strategy-report-loader'
import { MetricsGrid } from '@/components/strategy-report/MetricsGrid'
import { ReportHeader } from '@/components/strategy-report/ReportHeader'
import { EquityCurveChart } from '@/components/strategy-report/charts/EquityCurveChart'
import { DistributionChartsGrid } from '@/components/strategy-report/charts/DistributionChartsGrid'
import { HoldingTimeScatterChart } from '@/components/strategy-report/charts/HoldingTimeScatterChart'
import { MonthlyReturnsTable } from '@/components/strategy-report/charts/MonthlyReturnsTable'

// Increase timeout for complex report generation
export const maxDuration = 60
export const revalidate = 3600 // Cache for 1 hour

interface PageProps {
  params: { magicNumber: string }
}

export default async function StrategyReportPage({ params }: PageProps) {
  const { magicNumber } = params

  // Load complete report data
  const reportData = await loadStrategyReport(magicNumber)

  // Calculate monthly returns for the table
  const initialBalance = reportData.charts.equityCurve[0]?.balance || 10000
  const monthlyReturnsData = calculateMonthlyReturns(reportData.charts.equityCurve, initialBalance)

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header with back button */}
      <div className="bg-white border-b border-border-light">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </a>

          <ReportHeader strategyInfo={reportData.strategyInfo} />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <Suspense fallback={<div>Loading metrics...</div>}>
          <MetricsGrid metrics={reportData.metrics} />
        </Suspense>

        {/* Trades summary */}
        <div className="mt-8">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
            Trades Summary
          </h2>
          <div className="card">
            <div className="grid grid-cols-2 gap-6">
              {/* Row 1 */}
              <div>
                <div className="text-xs text-text-muted uppercase">Total Trades</div>
                <div className="text-2xl font-bold font-mono text-text-primary mt-1">
                  {reportData.tradesSummary.totalTrades}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase">Win Rate</div>
                <div className="text-2xl font-bold font-mono text-accent-profit mt-1">
                  {reportData.tradesSummary.winRate.toFixed(2)}%
                </div>
              </div>

              {/* Row 2 - Average Win/Loss */}
              <div>
                <div className="text-xs text-text-muted uppercase">Average Win</div>
                <div className="text-2xl font-bold font-mono text-accent-profit mt-1">
                  ${reportData.tradesSummary.averageProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase">Average Loss</div>
                <div className="text-2xl font-bold font-mono text-accent-loss mt-1">
                  ${Math.abs(reportData.tradesSummary.averageLoss).toFixed(2)}
                </div>
              </div>

              {/* Row 3 - Largest Win/Loss */}
              <div>
                <div className="text-xs text-text-muted uppercase">Largest Win</div>
                <div className="text-2xl font-bold font-mono text-accent-profit mt-1">
                  ${reportData.tradesSummary.largestProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase">Largest Loss</div>
                <div className="text-2xl font-bold font-mono text-accent-loss mt-1">
                  ${Math.abs(reportData.tradesSummary.largestLoss).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
            Performance Charts
          </h2>

          {/* Equity Curve & Drawdown */}
          <div className="space-y-2">
            <h3 className="text-lg font-display font-medium text-text-primary">
              Equity Curve & Drawdown
            </h3>
            <EquityCurveChart
              equityCurve={reportData.charts.equityCurve}
              drawdown={reportData.charts.drawdown}
            />
          </div>

          {/* Monthly Returns Table */}
          <MonthlyReturnsTable data={monthlyReturnsData} />

          {/* Time-based Distributions */}
          <div className="space-y-2">
            <h3 className="text-lg font-display font-medium text-text-primary">
              Entry & P/L Distribution Analysis
            </h3>
            <DistributionChartsGrid
              hourlyDist={reportData.charts.hourlyDistribution}
              dailyDist={reportData.charts.dailyDistribution}
              monthlyDist={reportData.charts.monthlyDistribution}
              yearlyDist={reportData.charts.yearlyDistribution}
            />
          </div>

          {/* Holding Time Analysis */}
          <div className="space-y-2">
            <h3 className="text-lg font-display font-medium text-text-primary">
              Holding Time Analysis
            </h3>
            <HoldingTimeScatterChart data={reportData.charts.holdingTimeScatter} />
          </div>
        </div>
      </div>
    </div>
  )
}
