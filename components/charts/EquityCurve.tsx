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
}

export function EquityCurve({
  data,
  showDrawdown = true,
  forwardTestStartDate
}: EquityCurveProps) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'equity') return [`$${value.toLocaleString()}`, 'Profit']
              if (name === 'drawdown') return [`$${value.toLocaleString()}`, 'Drawdown']
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
                position: 'top',
                fill: '#10b981',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}

          {showDrawdown && (
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#dc2626"
              fill="url(#drawdownGradient)"
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
