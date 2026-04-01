'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { EquityCurvePoint, DrawdownPoint } from '@/lib/types/strategy-report'

interface EquityCurveChartProps {
  equityCurve: EquityCurvePoint[]
  drawdown: DrawdownPoint[]
}

export function EquityCurveChart({ equityCurve, drawdown }: EquityCurveChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Merge equity and drawdown data by date
  const mergedData = equityCurve.map((point) => {
    const ddPoint = drawdown.find((d) => d.date === point.date)
    return {
      date: point.date,
      balance: point.balance,
      equity: point.equity,
      drawdown: ddPoint?.drawdown || 0,
    }
  })

  // Calculate Y-axis domain for equity chart
  const maxEquity = Math.max(...equityCurve.map((d) => Math.max(d.balance, d.equity)))
  const minEquity = Math.min(...equityCurve.map((d) => Math.min(d.balance, d.equity)))
  const equityRange = maxEquity - minEquity
  const equityMin = Math.floor((minEquity - equityRange * 0.1) / 1000) * 1000
  const equityMax = Math.ceil((maxEquity + equityRange * 0.1) / 1000) * 1000

  // Calculate Y-axis domain for drawdown chart
  const minDrawdown = Math.min(...drawdown.map((d) => d.drawdown))
  const ddRange = Math.abs(minDrawdown)
  const ddMin = Math.floor((minDrawdown - ddRange * 0.1) / 100) * 100
  const ddMax = 0

  return (
    <div className="card space-y-4">
      <h3 className="text-base font-display font-semibold text-text-primary">Equity Curve</h3>

      {/* Equity Chart */}
      <div className="w-full h-[300px]">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
            <ComposedChart
              data={mergedData}
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

              <XAxis
                dataKey="date"
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const year = String(date.getFullYear()).slice(-2)
                  return `${month}/${year}`
                }}
              />

              <YAxis
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[equityMin, equityMax]}
              />

              <Tooltip
                content={<CustomTooltip type="equity" />}
                cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
              />

              <ReferenceLine y={0} stroke="#54585f" strokeDasharray="3 3" />

              <Area
                type="monotone"
                dataKey="equity"
                stroke="#3b82f6"
                fill="url(#equityGradient)"
                strokeWidth={2}
              />

              <Line
                type="monotone"
                dataKey="balance"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#16a34a' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Drawdown Chart */}
      <div className="w-full h-[100px]">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
            <ComposedChart
              data={mergedData}
              margin={{ top: 0, right: 20, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

              <XAxis
                dataKey="date"
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const year = String(date.getFullYear()).slice(-2)
                  return `${month}/${year}`
                }}
              />

              <YAxis
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                domain={[ddMin, ddMax]}
              />

              <Tooltip
                content={<CustomTooltip type="drawdown" />}
                cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
              />

              <ReferenceLine y={0} stroke="#54585f" strokeDasharray="3 3" />

              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#dc2626"
                fill="url(#drawdownGradient)"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// Custom tooltip component
function CustomTooltip({ active, payload, type }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">
        {new Date(data.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="space-y-1 mt-2">
        {type === 'equity' ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-text-muted">Balance:</span>
              <span className="chart-tooltip-value text-accent-profit">
                ${Math.round(data.balance).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-text-muted">Equity:</span>
              <span className="chart-tooltip-value text-accent-info">
                ${Math.round(data.equity).toLocaleString()}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-muted">Drawdown:</span>
            <span className="chart-tooltip-value text-accent-loss">
              ${Math.round(Math.abs(data.drawdown)).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
