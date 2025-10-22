import { Logo } from '@/components/brand/Logo'
import Image from 'next/image'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="border-b border-border-light bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-text-muted"></span>
            </div>
          </div>
        </div>
      </header>

      {/* Loading Spinner */}
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            {/* Spinning logo sun */}
            <Image
              src="/images/logo-sun.png"
              alt="Loading"
              width={64}
              height={64}
              className="animate-spin"
              style={{ animationDuration: '2s' }}
            />
          </div>
          <p className="text-text-secondary text-sm">Loading portfolio data...</p>
        </div>
      </div>
    </div>
  )
}
