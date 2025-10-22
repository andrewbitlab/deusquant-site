'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Strategy {
  id: string
  magicNumber: number
  name: string
  symbol: string
  totalProfit: number
  winRate: number
  maxDrawdown: number // Now in dollars
  sharpeRatio: number
  hasForwardTest: boolean
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
              <th>ID</th>
              <th>Name</th>
              <th>Symbol</th>
              <th>Total Profit</th>
              <th>Win Rate</th>
              <th>Max DD</th>
              <th>Sharpe</th>
              <th>Report</th>
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
                  ${Math.round(strategy.totalProfit).toLocaleString('en-US')}
                </td>
                <td className="font-mono">{strategy.winRate.toFixed(2)}%</td>
                <td className="font-mono text-accent-loss">
                  ${strategy.maxDrawdown.toLocaleString()}
                </td>
                <td className="font-mono">{strategy.sharpeRatio.toFixed(2)}</td>
                <td>
                  <Link
                    href={`/dashboard/backtest/${strategy.magicNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-info hover:text-blue-700 hover:underline transition-colors"
                    title="View Backtest Report"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                      <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    View
                  </Link>
                </td>
                <td>
                  {strategy.hasForwardTest ? (
                    <span className="badge-info">Active</span>
                  ) : (
                    <span className="badge-secondary">Backtest Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
