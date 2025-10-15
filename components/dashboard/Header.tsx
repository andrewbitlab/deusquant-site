'use client'

import { Logo } from '../brand/Logo'
import { RefreshCw } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="border-b border-border-light bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Logo />

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-text-muted">Last Update:</span>
            <span className="ml-2 font-mono text-text-primary">
              {new Date().toLocaleString()}
            </span>
          </div>
          <button
            className="p-2 hover:bg-bg-secondary rounded-md transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  )
}
