'use client'

import { Logo } from '../brand/Logo'
import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    // Only render time on client to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }))
  }, [])

  return (
    <header className="border-b border-border-light bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Logo />

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-text-muted">Last Update:</span>
            <span className="ml-2 font-mono text-text-primary">
              {currentTime || '—'}
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
