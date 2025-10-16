'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon - scaled down to match original circle size (40px) */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <Image
          src="/brand/logo-icon.png"
          alt="DEUS QUANT Logo"
          width={40}
          height={40}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          {/* Logo Name - scaled to match original text size (~20px height) */}
          <div className="relative h-5">
            <Image
              src="/brand/logo-name.png"
              alt="DEUS QUANT"
              width={120}
              height={20}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-0.5">
            Portfolio System
          </div>
        </div>
      )}
    </div>
  )
}
