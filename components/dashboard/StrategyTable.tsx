'use client'

import { useState, useEffect } from 'react'

interface Strategy {
  id: string
  magicNumber: number
  name: string
  symbol: string
  totalProfit: number
  winRate: number
  maxDrawdown: number // Now in dollars
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
  // Initialize with all strategies selected
  const [selected, setSelected] = useState<Set<string>>(
    new Set(strategies.map((s) => s.id))
  )

  // Update selection when strategies change
  useEffect(() => {
    const allIds = new Set(strategies.map((s) => s.id))
    setSelected(allIds)
    onSelectionChange?.(Array.from(allIds))
  }, [strategies.length]) // Only reset when number of strategies changes

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

  const toggleSelectAll = () => {
    if (selected.size === strategies.length) {
      // Deselect all
      setSelected(new Set())
      onSelectionChange?.([])
    } else {
      // Select all
      const allIds = new Set(strategies.map((s) => s.id))
      setSelected(allIds)
      onSelectionChange?.(Array.from(allIds))
    }
  }

  const allSelected = selected.size === strategies.length
  const someSelected = selected.size > 0 && selected.size < strategies.length

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-deus">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className="rounded"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected
                    }
                  }}
                  onChange={toggleSelectAll}
                />
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
                  ${strategy.maxDrawdown.toLocaleString()}
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
