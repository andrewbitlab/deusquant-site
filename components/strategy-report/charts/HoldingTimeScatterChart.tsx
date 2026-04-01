'use client'

import { useEffect, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts'
import type { HoldingTimePoint } from '@/lib/types/strategy-report'

interface HoldingTimeScatterChartProps {
  data: HoldingTimePoint[]
}

export function HoldingTimeScatterChart({ data }: HoldingTimeScatterChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Separate profitable and losing trades
  const profitableTrades = data.filter((d) => d.profit > 0)
  const losingTrades = data.filter((d) => d.profit <= 0)

  // Calculate domain
  const maxHoldingTime = Math.max(...data.map((d) => d.holdingTimeHours))
  const maxProfit = Math.max(...data.map((d) => Math.abs(d.profit)))
  const minProfit = Math.min(...data.map((d) => d.profit))

  // X-axis domain: 0 to max holding time with 10% padding
  const xMax = Math.ceil(maxHoldingTime * 1.1)

  // Generate nice ticks for X-axis (always include 0)
  const generateXTicks = (max: number): number[] => {
    if (max <= 24) {
      // For < 1 day: 0, 8h, 16h, 24h
      return [0, 8, 16, 24]
    } else if (max <= 120) {
      // For 1-5 days: 0, 1d, 2d, 3d, 4d, 5d
      return [0, 24, 48, 72, 96, 120]
    } else if (max <= 720) {
      // For 5-30 days: 0, 7d, 14d, 21d, 30d
      return [0, 168, 336, 504, 720]
    } else {
      // For > 30 days: 0, 30d, 60d, 90d, 120d, 150d, 180d
      const step = Math.ceil(max / 6 / 720) * 720 // Round to nearest 30 days
      return Array.from({ length: 7 }, (_, i) => i * step)
    }
  }

  const xTicks = generateXTicks(xMax).filter(tick => tick <= xMax)

  // Y-axis domain: min to max profit with padding
  const yMin = Math.floor(minProfit * 1.1 / 1000) * 1000
  const yMax = Math.ceil(maxProfit * 1.1 / 1000) * 1000

  return (
    <div className="card">
      <h3 className="text-base font-display font-semibold text-text-primary mb-4">
        Profit vs Holding Time
      </h3>

      <div className="w-full h-[300px]">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

              <XAxis
                type="number"
                dataKey="holdingTimeHours"
                name="Holding Time"
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                label={{
                  value: 'Holding Time (hours)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: '#7a7d84', fontSize: 12 },
                }}
                tickFormatter={(value) => {
                  if (value >= 24) return `${(value / 24).toFixed(0)}d`
                  return `${value}h`
                }}
                domain={[0, xMax]}
                ticks={xTicks}
              />

              <YAxis
                type="number"
                dataKey="profit"
                name="Profit"
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                label={{
                  value: 'Profit ($)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#7a7d84', fontSize: 12 },
                }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[yMin, yMax]}
              />

              <ZAxis range={[20, 100]} />

              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              <ReferenceLine y={0} stroke="#54585f" strokeWidth={2} strokeDasharray="3 3" />

              {/* Profitable trades - green dots */}
              <Scatter
                name="Profitable Trades"
                data={profitableTrades}
                fill="#16a34a"
                fillOpacity={0.6}
                stroke="#16a34a"
                strokeWidth={1}
              />

              {/* Losing trades - red dots */}
              <Scatter
                name="Losing Trades"
                data={losingTrades}
                fill="#dc2626"
                fillOpacity={0.6}
                stroke="#dc2626"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-profit opacity-60"></div>
          <span className="text-text-muted">
            Profitable ({profitableTrades.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-loss opacity-60"></div>
          <span className="text-text-muted">
            Losing ({losingTrades.length})
          </span>
        </div>
      </div>
    </div>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as HoldingTimePoint

  // Format holding time
  const formatHoldingTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`
    if (hours < 24) return `${hours.toFixed(1)} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days} days`
    return `${days}d ${remainingHours.toFixed(0)}h`
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Trade #{data.tradeId}</div>
      <div className="space-y-1 mt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-text-muted">Profit:</span>
          <span className={`chart-tooltip-value ${data.profit >= 0 ? 'text-accent-profit' : 'text-accent-loss'}`}>
            ${Math.round(data.profit).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-text-muted">Duration:</span>
          <span className="chart-tooltip-value">
            {formatHoldingTime(data.holdingTimeHours)}
          </span>
        </div>
        <div className="pt-1 border-t border-border-light">
          <div className="text-xs text-text-muted">
            {new Date(data.openTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
