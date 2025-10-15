'use client'

interface MonthlyHeatmapProps {
  data: Map<string, number>
}

export function MonthlyHeatmap({ data }: MonthlyHeatmapProps) {
  const getColor = (value: number) => {
    if (value > 5) return 'bg-green-600'
    if (value > 0) return 'bg-green-400'
    if (value > -5) return 'bg-red-400'
    return 'bg-red-600'
  }

  return (
    <div className="card">
      <h3 className="font-display text-lg font-semibold mb-4">Monthly Returns</h3>
      <div className="grid grid-cols-12 gap-2">
        {Array.from(data.entries()).slice(0, 60).map(([month, return_]) => (
          <div
            key={month}
            className={`${getColor(return_)} text-white text-xs p-2 rounded text-center`}
            title={`${month}: ${return_.toFixed(2)}%`}
          >
            {return_.toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  )
}
