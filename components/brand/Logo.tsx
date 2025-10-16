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
      {/* Logo Icon - 40px */}
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
        <div className="flex items-center">
          {/* Logo Name - scaled to match icon height (40px) */}
          <div className="relative h-10">
            <Image
              src="/brand/logo-name.png"
              alt="DEUS QUANT"
              width={240}
              height={40}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}
