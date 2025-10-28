'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TimeDistribution } from '@/lib/types/strategy-report'

interface DistributionChartsGridProps {
  hourlyDist: TimeDistribution[]
  dailyDist: TimeDistribution[]
  monthlyDist: TimeDistribution[]
}

export function DistributionChartsGrid({
  hourlyDist,
  dailyDist,
  monthlyDist,
}: DistributionChartsGridProps) {
  return (
    <div className="card">
      <h3 className="text-base font-display font-semibold text-text-primary mb-4">
        Distribution Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Entry Distribution Charts */}
        <DistributionChart
          title="Hourly Entries"
          data={hourlyDist}
          dataKey="entryCount"
          color="#f59e0b"
          gradientId="hourGradient"
          gradientFrom="#f59e0b"
          gradientTo="#16a34a"
        />

        <DistributionChart
          title="Daily Entries"
          data={dailyDist}
          dataKey="entryCount"
          color="#16a34a"
          gradientId="dayGradient"
          gradientFrom="#16a34a"
          gradientTo="#16a34a"
        />

        <DistributionChart
          title="Monthly Entries"
          data={monthlyDist}
          dataKey="entryCount"
          color="#3b82f6"
          gradientId="monthGradient"
          gradientFrom="#3b82f6"
          gradientTo="#3b82f6"
        />

        {/* P&L Distribution Charts */}
        <ProfitLossChart
          title="Hourly P&L"
          data={hourlyDist}
        />

        <ProfitLossChart
          title="Daily P&L"
          data={dailyDist}
        />

        <ProfitLossChart
          title="Monthly P&L"
          data={monthlyDist}
        />
      </div>
    </div>
  )
}

// Simple distribution chart for entry counts
function DistributionChart({
  title,
  data,
  dataKey,
  color,
  gradientId,
  gradientFrom,
  gradientTo,
}: {
  title: string
  data: TimeDistribution[]
  dataKey: string
  color: string
  gradientId: string
  gradientFrom: string
  gradientTo: string
}) {
  const maxValue = Math.max(...data.map((d: any) => d[dataKey]))

  return (
    <div>
      <h4 className="text-sm font-display font-medium text-text-secondary mb-3">{title}</h4>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.8} />
                <stop offset="100%" stopColor={gradientTo} stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

            <XAxis
              dataKey="label"
              stroke="#a0a3a9"
              tick={{ fill: '#7a7d84', fontSize: 10 }}
            />

            <YAxis
              stroke="#a0a3a9"
              tick={{ fill: '#7a7d84', fontSize: 10 }}
              tickFormatter={(value) => value.toLocaleString()}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const data = payload[0].payload
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">{data.label}</div>
                    <div className="chart-tooltip-value mt-1">
                      {data[dataKey].toLocaleString()} entries
                    </div>
                  </div>
                )
              }}
            />

            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${gradientId})`}
                  opacity={0.7 + (entry[dataKey as keyof typeof entry] as number / maxValue) * 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Stacked P&L chart
function ProfitLossChart({
  title,
  data,
}: {
  title: string
  data: TimeDistribution[]
}) {
  return (
    <div>
      <h4 className="text-sm font-display font-medium text-text-secondary mb-3">{title}</h4>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />

            <XAxis
              dataKey="label"
              stroke="#a0a3a9"
              tick={{ fill: '#7a7d84', fontSize: 10 }}
            />

            <YAxis
              stroke="#a0a3a9"
              tick={{ fill: '#7a7d84', fontSize: 10 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const data = payload[0].payload
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">{data.label}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-text-muted">Profit:</span>
                        <span className="chart-tooltip-value text-accent-profit">
                          ${Math.round(data.profitSum).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-text-muted">Loss:</span>
                        <span className="chart-tooltip-value text-accent-loss">
                          ${Math.round(Math.abs(data.lossSum)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-border-light">
                        <span className="text-xs text-text-muted font-semibold">Net:</span>
                        <span className={`chart-tooltip-value ${data.netProfit >= 0 ? 'text-accent-profit' : 'text-accent-loss'}`}>
                          ${Math.round(data.netProfit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />

            <Bar dataKey="profitSum" stackId="pnl" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lossSum" stackId="pnl" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
