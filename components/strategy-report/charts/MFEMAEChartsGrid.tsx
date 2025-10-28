'use client'

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
import type { MAEMFEPoint } from '@/lib/types/strategy-report'

interface MFEMAEChartsGridProps {
  data: MAEMFEPoint[]
}

export function MFEMAEChartsGrid({ data }: MFEMAEChartsGridProps) {
  // Calculate domains for both charts
  const maxMFE = Math.max(...data.map((d) => Math.abs(d.mfe)))
  const maxMAE = Math.max(...data.map((d) => Math.abs(d.mae)))
  const maxProfit = Math.max(...data.map((d) => Math.abs(d.profit)))
  const minProfit = Math.min(...data.map((d) => d.profit))

  const yMin = Math.floor(minProfit * 1.1 / 1000) * 1000
  const yMax = Math.ceil(maxProfit * 1.1 / 1000) * 1000

  const xMinMFE = Math.floor(0)
  const xMaxMFE = Math.ceil(maxMFE * 1.1 / 1000) * 1000

  const xMinMAE = Math.floor(Math.min(...data.map((d) => d.mae)) * 1.1 / 1000) * 1000
  const xMaxMAE = Math.ceil(0)

  return (
    <div className="card space-y-6">
      <h3 className="text-base font-display font-semibold text-text-primary">
        MAE/MFE Analysis
      </h3>

      {/* MFE Chart - Profit vs Maximum Favorable Excursion */}
      <div>
        <h4 className="text-sm font-display font-medium text-text-secondary mb-3">
          Profit vs MFE (Maximum Favorable Excursion)
        </h4>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

              <XAxis
                type="number"
                dataKey="mfe"
                name="MFE"
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                label={{
                  value: 'Maximum Favorable Excursion ($)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: '#7a7d84', fontSize: 11 },
                }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[xMinMFE, xMaxMFE]}
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
                  style: { fill: '#7a7d84', fontSize: 11 },
                }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[yMin, yMax]}
              />

              <ZAxis range={[20, 80]} />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const data = payload[0].payload as MAEMFEPoint
                  return <CustomTooltip data={data} type="MFE" />
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />

              <ReferenceLine x={0} stroke="#54585f" strokeWidth={1} strokeDasharray="3 3" />
              <ReferenceLine y={0} stroke="#54585f" strokeWidth={2} strokeDasharray="3 3" />

              <Scatter
                name="Trades"
                data={data}
                fill="#3b82f6"
                fillOpacity={0.5}
                stroke="#3b82f6"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MAE Chart - Profit vs Maximum Adverse Excursion */}
      <div>
        <h4 className="text-sm font-display font-medium text-text-secondary mb-3">
          Profit vs MAE (Maximum Adverse Excursion)
        </h4>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

              <XAxis
                type="number"
                dataKey="mae"
                name="MAE"
                stroke="#a0a3a9"
                tick={{ fill: '#7a7d84', fontSize: 11 }}
                label={{
                  value: 'Maximum Adverse Excursion ($)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: '#7a7d84', fontSize: 11 },
                }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[xMinMAE, xMaxMAE]}
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
                  style: { fill: '#7a7d84', fontSize: 11 },
                }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[yMin, yMax]}
              />

              <ZAxis range={[20, 80]} />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const data = payload[0].payload as MAEMFEPoint
                  return <CustomTooltip data={data} type="MAE" />
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />

              <ReferenceLine x={0} stroke="#54585f" strokeWidth={1} strokeDasharray="3 3" />
              <ReferenceLine y={0} stroke="#54585f" strokeWidth={2} strokeDasharray="3 3" />

              <Scatter
                name="Trades"
                data={data}
                fill="#f59e0b"
                fillOpacity={0.5}
                stroke="#f59e0b"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-text-muted bg-bg-secondary rounded-md p-3 border border-border-light">
        <p className="mb-1">
          <strong className="text-text-primary">MFE (Maximum Favorable Excursion):</strong> The
          maximum profit a trade reached before closing. Higher MFE relative to final profit
          suggests potential for better exits.
        </p>
        <p>
          <strong className="text-text-primary">MAE (Maximum Adverse Excursion):</strong> The
          maximum loss a trade experienced before closing. Analyzing MAE helps optimize stop-loss
          levels.
        </p>
      </div>
    </div>
  )
}

// Custom tooltip
function CustomTooltip({ data, type }: { data: MAEMFEPoint; type: 'MFE' | 'MAE' }) {
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Trade #{data.tradeId}</div>
      <div className="space-y-1 mt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-text-muted">Profit:</span>
          <span
            className={`chart-tooltip-value ${data.profit >= 0 ? 'text-accent-profit' : 'text-accent-loss'}`}
          >
            ${Math.round(data.profit).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-text-muted">{type}:</span>
          <span className="chart-tooltip-value">
            ${Math.round(Math.abs(type === 'MFE' ? data.mfe : data.mae)).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-text-muted">Volume:</span>
          <span className="chart-tooltip-value">
            {data.volume.toFixed(2)}
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
