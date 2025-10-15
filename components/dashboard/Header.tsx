'use client'

import { Logo } from '../brand/Logo'
import { RefreshCw, Upload as UploadIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function DashboardHeader() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    // Only render time on client to avoid hydration mismatch
    updateTime()
  }, [])

  const updateTime = () => {
    setCurrentTime(
      new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMessage(null)

    try {
      // Call the API to reload strategies
      const response = await fetch('/api/strategies/load')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh data')
      }

      // Update timestamp
      updateTime()

      // Refresh the page data
      router.refresh()

      // Show success message
      setMessage({
        type: 'success',
        text: `Refreshed successfully - ${result.count} strategies loaded`,
      })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to refresh data',
      })

      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
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

            <Link
              href="/upload"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-deus-gray hover:bg-bg-secondary rounded-md transition-colors"
            >
              <UploadIcon className="h-4 w-4" />
              Upload
            </Link>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh data"
              title="Refresh data from files"
            >
              <RefreshCw
                className={`h-4 w-4 text-text-secondary ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {message && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}
    </>
  )
}
