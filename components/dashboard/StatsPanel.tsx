'use client'

interface Stat {
  label: string
  value: string | number
  compoundedValue?: number // For showing fixed vs compounded comparison
  change?: number
  format?: 'currency' | 'percent' | 'number' | 'ratio'
}

interface StatsPanelProps {
  stats: Stat[]
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const formatSingleValue = (value: number, stat: Stat): string => {
    switch (stat.format) {
      case 'currency':
        return `$${Math.round(value).toLocaleString('en-US')}`
      case 'percent':
        // Add + sign for positive percentages (except Max Drawdown which is always shown as positive)
        const sign = value > 0 && !stat.label.includes('Drawdown') ? '+' : ''
        // Use whole numbers for Total Profit, 2 decimals for others
        const decimals = stat.label.includes('Total Profit') ? 0 : 2
        const formattedValue = stat.label.includes('Total Profit')
          ? Math.round(value).toLocaleString('en-US')
          : value.toFixed(decimals)
        return `${sign}${formattedValue}%`
      case 'ratio':
        return value.toFixed(2)
      case 'number':
        return value.toLocaleString()
      default:
        return value.toLocaleString()
    }
  }

  const getValueColor = (stat: Stat): string => {
    // Color coding for profit percentages
    if ((stat.label.includes('Total Profit') || stat.label.includes('Monthly Profit')) && typeof stat.value === 'number') {
      if (stat.value > 0) return 'text-accent-profit'
      if (stat.value < 0) return 'text-accent-loss'
    }
    return 'text-text-primary'
  }

  // Check if any stat has compoundedValue to show legend
  const hasCompoundedValues = stats.some(stat => stat.compoundedValue !== undefined)

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          return (
            <div key={i} className="card flex flex-col">
              <div className="stat-label h-10 sm:h-12 flex items-start text-xs sm:text-sm">
                <span>{stat.label}</span>
              </div>
            {typeof stat.value === 'string' ? (
              <div className={`stat-value ${getValueColor(stat)}`}>{stat.value}</div>
            ) : stat.compoundedValue !== undefined ? (
              <div className="flex flex-col gap-0.5">
                <div className={`stat-value ${getValueColor(stat)}`}>
                  {formatSingleValue(stat.value as number, stat)}
                </div>
                <div className={`stat-value text-accent-profit`}>
                  {formatSingleValue(stat.compoundedValue, stat)}
                </div>
              </div>
            ) : (
              <div className={`stat-value ${getValueColor(stat)}`}>
                {formatSingleValue(stat.value as number, stat)}
              </div>
            )}
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
          )
        })}
      </div>
      {hasCompoundedValues && (
        <div className="mt-2 text-xs sm:text-sm text-text-secondary text-center px-2">
          Values shown as: <span className="font-semibold">Fixed Position</span> (top) / <span className="font-semibold">Monthly Compounding</span> (bottom)
        </div>
      )}
    </div>
  )
}
