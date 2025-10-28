'use client'

import type { PerformanceMetrics } from '@/lib/types/strategy-report'

interface MetricsGridProps {
  metrics: PerformanceMetrics
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`
  const formatNumber = (value: number) => value.toLocaleString('en-US')

  return (
    <div className="space-y-6">
      {/* Profit Metrics */}
      <section>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Profit Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard label="Total Net Profit" value={formatCurrency(metrics.totalNetProfit)} valueColor="profit" />
          <MetricCard label="Gross Profit" value={formatCurrency(metrics.grossProfit)} valueColor="profit" />
          <MetricCard label="Gross Loss" value={formatCurrency(metrics.grossLoss)} valueColor="loss" />
        </div>
      </section>

      {/* Drawdown Metrics */}
      <section>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Drawdown Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-display font-medium text-text-secondary mb-2">Balance Drawdown</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Absolute Max" value={formatCurrency(metrics.balanceDrawdownAbsolute)} valueColor="loss" compact />
              <MetricCard label="Relative Max" value={formatPercent(metrics.balanceDrawdownRelativePercent)} valueColor="loss" compact />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-display font-medium text-text-secondary mb-2">Equity Drawdown</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Absolute Max" value={formatCurrency(metrics.equityDrawdownAbsolute)} valueColor="loss" compact />
              <MetricCard label="Relative Max" value={formatPercent(metrics.equityDrawdownRelativePercent)} valueColor="loss" compact />
            </div>
          </div>
        </div>
      </section>

      {/* Performance Ratios */}
      <section>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Performance Ratios</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <MetricCard label="Profit Factor" value={metrics.profitFactor.toFixed(2)} />
          <MetricCard label="Expected Payoff" value={formatCurrency(metrics.expectedPayoff)} />
          <MetricCard label="Recovery Factor" value={metrics.recoveryFactor.toFixed(2)} />
          <MetricCard label="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} />
          <MetricCard label="Z-Score" value={`${metrics.zScore.toFixed(2)} (${formatPercent(metrics.zScorePercent)})`} />
          <MetricCard label="AHPR" value={`${metrics.ahpr.toFixed(4)} (${formatPercent(metrics.ahprPercent)})`} />
          <MetricCard label="GHPR" value={`${metrics.ghpr.toFixed(4)} (${formatPercent(metrics.ghprPercent)})`} />
          <MetricCard label="LR Correlation" value={metrics.lrCorrelation.toFixed(2)} />
        </div>
      </section>

      {/* Trade Statistics */}
      <section>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Trade Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Trades" value={formatNumber(metrics.totalTrades)} />
          <MetricCard label="Total Deals" value={formatNumber(metrics.totalDeals)} />
          <MetricCard label="Profit Trades" value={`${formatNumber(metrics.profitTrades)} (${formatPercent(metrics.profitTradesPercent)})`} valueColor="profit" />
          <MetricCard label="Loss Trades" value={`${formatNumber(metrics.lossTrades)} (${formatPercent(metrics.lossTradesPercent)})`} valueColor="loss" />
          <MetricCard label="Long Trades Win %" value={formatPercent(metrics.longTradesWinPercent)} />
          <MetricCard label="Short Trades Win %" value={formatPercent(metrics.shortTradesWinPercent)} />
        </div>
      </section>

      {/* Win/Loss Analysis */}
      <section>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Win/Loss Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Largest Profit Trade" value={formatCurrency(metrics.largestProfitTrade)} valueColor="profit" />
          <MetricCard label="Largest Loss Trade" value={formatCurrency(metrics.largestLossTrade)} valueColor="loss" />
          <MetricCard label="Average Profit Trade" value={formatCurrency(metrics.averageProfitTrade)} valueColor="profit" />
          <MetricCard label="Average Loss Trade" value={formatCurrency(metrics.averageLossTrade)} valueColor="loss" />
          <MetricCard label="Max Consecutive Wins" value={`${metrics.maxConsecutiveWins} (${formatCurrency(metrics.maxConsecutiveWinsDollars)})`} />
          <MetricCard label="Max Consecutive Losses" value={`${metrics.maxConsecutiveLosses} (${formatCurrency(metrics.maxConsecutiveLossesDollars)})`} />
          <MetricCard label="Avg Consecutive Wins" value={metrics.averageConsecutiveWins.toFixed(1)} />
          <MetricCard label="Avg Consecutive Losses" value={metrics.averageConsecutiveLosses.toFixed(1)} />
        </div>
      </section>

      {/* Correlation & Time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Correlation Metrics</h2>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard label="Correlation (Profit, MFE)" value={metrics.correlationProfitMFE.toFixed(4)} />
            <MetricCard label="Correlation (Profit, MAE)" value={metrics.correlationProfitMAE.toFixed(4)} />
            <MetricCard label="Correlation (MFE, MAE)" value={metrics.correlationMFEMAE.toFixed(4)} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Holding Time</h2>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard label="Minimum" value={metrics.minHoldingTime} />
            <MetricCard label="Maximum" value={metrics.maxHoldingTime} />
            <MetricCard label="Average" value={metrics.avgHoldingTime} />
          </div>
        </section>
      </div>
    </div>
  )
}

// Reusable metric card component
function MetricCard({
  label,
  value,
  valueColor,
  compact = false,
}: {
  label: string
  value: string
  valueColor?: 'profit' | 'loss'
  compact?: boolean
}) {
  const colorClass = valueColor === 'profit' ? 'text-accent-profit' : valueColor === 'loss' ? 'text-accent-loss' : 'text-text-primary'

  return (
    <div className="card">
      <div className="flex-1 min-w-0">
        <div className={`text-xs ${compact ? 'sm:text-xs' : 'sm:text-sm'} text-text-muted uppercase tracking-wide`}>
          {label}
        </div>
        <div className={`${compact ? 'text-base' : 'text-lg md:text-xl'} font-bold font-mono ${colorClass} mt-1 break-words`}>
          {value}
        </div>
      </div>
    </div>
  )
}
