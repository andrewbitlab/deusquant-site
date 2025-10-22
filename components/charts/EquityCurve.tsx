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

  // Round to appropriate increments based on format
  const increment = isPercentage ? 10 : 2500
  const yAxisMin = Math.floor(minDrawdown / increment) * increment
  const yAxisMax = Math.ceil(maxEquity * 1.1 / increment) * increment

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
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: 12,
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
                value: 'Forward Test (Out of Sample)',
                position: 'insideTopRight',
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
