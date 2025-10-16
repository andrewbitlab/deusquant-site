import { Logo } from '@/components/brand/Logo'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="border-b border-border-light bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-text-muted">Loading Portfolio...</span>
            </div>
          </div>
        </div>
      </header>

      {/* Loading Spinner */}
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            {/* Spinning loader */}
            <div className="absolute inset-0 border-4 border-border-light rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent-info border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-text-secondary text-sm">Loading portfolio data...</p>
        </div>
      </div>
    </div>
  )
}
