'use client'

interface Stat {
  label: string
  value: string | number
  change?: number
  format?: 'currency' | 'percent' | 'number' | 'ratio'
}

interface StatsPanelProps {
  stats: Stat[]
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const formatValue = (stat: Stat): string => {
    if (typeof stat.value === 'string') return stat.value

    switch (stat.format) {
      case 'currency':
        return `$${Math.round(stat.value).toLocaleString('en-US')}`
      case 'percent':
        // Add + sign for positive percentages (except Max Drawdown which is always shown as positive)
        const sign = stat.value > 0 && !stat.label.includes('Drawdown') ? '+' : ''
        return `${sign}${stat.value.toFixed(2)}%`
      case 'ratio':
        return stat.value.toFixed(2)
      case 'number':
        return stat.value.toLocaleString()
      default:
        return stat.value.toLocaleString()
    }
  }

  const getValueColor = (stat: Stat): string => {
    // Color coding for Total Profit %
    if (stat.label.includes('Total Profit') && typeof stat.value === 'number') {
      if (stat.value > 0) return 'text-accent-profit'
      if (stat.value < 0) return 'text-accent-loss'
    }
    return 'text-text-primary'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="card">
          <div className="stat-label">{stat.label}</div>
          <div className={`stat-value ${getValueColor(stat)}`}>{formatValue(stat)}</div>
          {stat.change !== undefined && (
            <div
              className={
                stat.change >= 0 ? 'stat-change-positive' : 'stat-change-negative'
              }
            >
              {stat.change >= 0 ? '+' : ''}
              {stat.change.toFixed(2)}%
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
