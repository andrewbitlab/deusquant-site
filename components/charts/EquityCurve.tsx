'use client'

import {
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface EquityCurveProps {
  data: Array<{
    date: string
    equity: number
    drawdown?: number
  }>
  showDrawdown?: boolean
  forwardTestStartDate?: string // ISO date string where forward test begins
  isPercentage?: boolean // If true, format as percentage instead of currency
}

export function EquityCurve({
  data,
  showDrawdown = true,
  forwardTestStartDate,
  isPercentage = false
}: EquityCurveProps) {
  // Calculate dynamic Y-axis domain based on actual data
  const maxEquity = Math.max(...data.map(d => d.equity))
  const minDrawdown = Math.min(...data.map(d => d.drawdown || 0))

  // Smart rounding function to get nice round numbers with equal intervals
  const calculateNiceScale = (dataMin: number, dataMax: number) => {
    // Add 10% padding to max
    const rawMax = dataMax * 1.1
    const range = rawMax - dataMin

    // Determine appropriate step size based on range
    let step: number
    if (range <= 10) step = 1
    else if (range <= 20) step = 2
    else if (range <= 50) step = 5
    else if (range <= 100) step = 10
    else if (range <= 200) step = 20
    else if (range <= 250) step = 25
    else if (range <= 500) step = 50
    else if (range <= 1000) step = 100
    else if (range <= 2000) step = 200
    else if (range <= 2500) step = 250
    else if (range <= 5000) step = 500
    else step = 1000

    // Round min and max to nearest step
    const niceMin = Math.floor(dataMin / step) * step
    const niceMax = Math.ceil(rawMax / step) * step

    // Generate ticks
    const ticks: number[] = []
    for (let i = niceMin; i <= niceMax; i += step) {
      ticks.push(i)
    }

    return { min: niceMin, max: niceMax, ticks, step }
  }

  const yAxisConfig = calculateNiceScale(minDrawdown, maxEquity)
  const yAxisMin = yAxisConfig.min
  const yAxisMax = yAxisConfig.max
  const yAxisTicks = yAxisConfig.ticks

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="forwardTestArea" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.15} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

          <XAxis
            dataKey="date"
            stroke="#a0a3a9"
            tick={{ fill: '#7a7d84', fontSize: 12 }}
            tickFormatter={(value) => {
              // Format as MM.YYYY (Polish format without day)
              const date = new Date(value)
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const year = date.getFullYear()
              return `${month}.${year}`
            }}
          />

          <YAxis
            stroke="#a0a3a9"
            tick={{ fill: '#7a7d84', fontSize: 12 }}
            tickFormatter={(value) =>
              isPercentage
                ? `${value.toFixed(0)}%`
                : `$${Math.round(value).toLocaleString('en-US')}`
            }
            domain={[yAxisMin, yAxisMax]}
            ticks={yAxisTicks}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: 12,
            }}
            labelFormatter={(label) => {
              // Format date as DD.MM.YYYY (Polish format with day)
              const date = new Date(label)
              const day = String(date.getDate()).padStart(2, '0')
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const year = date.getFullYear()
              return `${day}.${month}.${year}`
            }}
            formatter={(value: number, name: string) => {
              if (isPercentage) {
                if (name === 'equity') return [`${value.toFixed(2)}%`, 'Profit']
                if (name === 'drawdown') return [`${Math.abs(value).toFixed(2)}%`, 'Drawdown']
              } else {
                if (name === 'equity') return [`$${Math.round(value).toLocaleString('en-US')}`, 'Profit']
                if (name === 'drawdown') return [`$${Math.round(Math.abs(value)).toLocaleString('en-US')}`, 'Drawdown']
              }
              return [value, name]
            }}
          />

          {/* Forward Test Period Marker */}
          {forwardTestStartDate && (
            <ReferenceLine
              x={forwardTestStartDate}
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'Live Data',
                position: 'insideTopLeft',
                fill: '#10b981',
                fontSize: 12,
                fontWeight: 600,
                offset: 10,
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="equity"
            stroke="#54585f"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#54585f' }}
          />

          {showDrawdown && (
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#dc2626"
              fill="url(#drawdownGradient)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
