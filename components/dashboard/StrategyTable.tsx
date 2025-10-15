'use client'

import { useState } from 'react'

interface Strategy {
  id: string
  magicNumber: number
  name: string
  symbol: string
  totalProfit: number
  winRate: number
  maxDrawdown: number
  sharpeRatio: number
  selected?: boolean
}

interface StrategyTableProps {
  strategies: Strategy[]
  onSelectionChange?: (selected: string[]) => void
}

export function StrategyTable({
  strategies,
  onSelectionChange,
}: StrategyTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-deus">
          <thead>
            <tr>
              <th>
                <input type="checkbox" className="rounded" />
              </th>
              <th>Magic #</th>
              <th>Name</th>
              <th>Symbol</th>
              <th>Total Profit</th>
              <th>Win Rate</th>
              <th>Max DD</th>
              <th>Sharpe</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy) => (
              <tr key={strategy.id}>
                <td>
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.has(strategy.id)}
                    onChange={() => toggleSelection(strategy.id)}
                  />
                </td>
                <td className="font-mono">{strategy.magicNumber}</td>
                <td className="font-medium">{strategy.name}</td>
                <td>{strategy.symbol}</td>
                <td
                  className={`font-mono ${
                    strategy.totalProfit >= 0
                      ? 'text-accent-profit'
                      : 'text-accent-loss'
                  }`}
                >
                  ${strategy.totalProfit.toLocaleString()}
                </td>
                <td className="font-mono">{strategy.winRate.toFixed(2)}%</td>
                <td className="font-mono text-accent-loss">
                  {strategy.maxDrawdown.toFixed(2)}%
                </td>
                <td className="font-mono">{strategy.sharpeRatio.toFixed(2)}</td>
                <td>
                  <span className="badge-info">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
