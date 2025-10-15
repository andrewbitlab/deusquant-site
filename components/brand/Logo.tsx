'use client'

import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-deus-gray to-text-secondary flex items-center justify-center animate-radial-pulse">
          <div className="w-6 h-6 rounded-full bg-white"></div>
        </div>
      </div>
      {showText && (
        <div className="font-display">
          <div className="text-xl font-bold text-deus-gray leading-none">
            DEUS QUANT
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">
            Portfolio System
          </div>
        </div>
      )}
    </div>
  )
}
