/**
 * Monthly Returns Table Component
 * Displays fixed-position monthly returns with color coding
 */

import type { MonthlyReturnsData } from '@/lib/types/strategy-report'

interface MonthlyReturnsTableProps {
  data: MonthlyReturnsData
  title?: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function MonthlyReturnsTable({ data, title = 'Fixed Position Monthly Returns (%)' }: MonthlyReturnsTableProps) {
  // Get full styling for a cell (text color + background) with gradient based on value
  const getCellStyle = (value: number | null): string => {
    if (value === null) return 'text-text-muted bg-gray-50'

    // Positive returns - profit gradient (lighter to darker as value increases)
    if (value > 0) {
      if (value >= 5) return 'text-white bg-profit-900 font-semibold'
      if (value >= 3) return 'text-white bg-profit-800 font-semibold'
      if (value >= 2) return 'text-white bg-profit-700 font-semibold'
      if (value >= 1) return 'text-white bg-profit-600 font-semibold'
      if (value >= 0.5) return 'text-text-primary bg-profit-400 font-semibold'
      return 'text-text-primary bg-profit-300 font-semibold'
    }

    // Negative returns - loss gradient (lighter to darker as loss increases)
    if (value < 0) {
      if (value <= -5) return 'text-white bg-loss-900 font-semibold'
      if (value <= -3) return 'text-white bg-loss-800 font-semibold'
      if (value <= -2) return 'text-white bg-loss-700 font-semibold'
      if (value <= -1) return 'text-white bg-loss-600 font-semibold'
      if (value <= -0.5) return 'text-text-primary bg-loss-400 font-semibold'
      return 'text-text-primary bg-loss-300 font-semibold'
    }

    return 'text-text-muted bg-gray-50'
  }

  // Get color class for text only (for Year column)
  const getTextColorClass = (value: number | null): string => {
    if (value === null) return 'text-text-muted'
    if (value > 0) return 'text-accent-profit'
    if (value < 0) return 'text-accent-loss'
    return 'text-text-muted'
  }

  // Format value for display
  const formatValue = (value: number | null): string => {
    if (value === null) return 'N/A'
    return value.toFixed(1)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-display font-medium text-text-primary mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-2 px-2 font-medium text-text-secondary">Year</th>
              {MONTH_NAMES.map((month) => (
                <th key={month} className="text-right py-2 px-2 font-medium text-text-secondary">
                  {month}
                </th>
              ))}
              <th className="text-right py-2 px-2 font-medium text-text-secondary bg-accent-warning/20">Year</th>
              <th className="text-right py-2 px-2 font-medium text-text-secondary bg-loss-100">MDD</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {data.years.map((yearData) => (
              <tr key={yearData.year} className="border-b border-border-light">
                <td className="py-2 px-2 font-semibold text-text-primary">{yearData.year}</td>
                {yearData.months.map((monthData, idx) => (
                  <td key={idx} className={`text-right py-2 px-2 ${getCellStyle(monthData.return)}`}>
                    {formatValue(monthData.return)}
                  </td>
                ))}
                <td className={`text-right py-2 px-2 font-bold bg-accent-warning/20 ${getTextColorClass(yearData.yearReturn)}`}>
                  {formatValue(yearData.yearReturn)}
                </td>
                <td className="text-right py-2 px-2 font-bold bg-loss-100 text-accent-loss">
                  {formatValue(yearData.yearMDD)}
                </td>
              </tr>
            ))}

            {/* Average/Mo Row */}
            <tr className="border-t-2 border-border-default font-bold">
              <td className="py-2 px-2 text-text-primary bg-gray-100">Avg/Mo</td>
              {data.avgMonthlyReturns.months.map((avgReturn, idx) => (
                <td key={idx} className={`text-right py-2 px-2 ${getCellStyle(avgReturn)}`}>
                  {formatValue(avgReturn)}
                </td>
              ))}
              <td className="py-2 px-2 bg-accent-warning/20"></td>
              <td className="text-right py-2 px-2 bg-loss-100 text-accent-loss">
                {formatValue(data.avgMonthlyReturns.mdd)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
