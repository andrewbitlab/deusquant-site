'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {/* Complete logo with icon + text (logo-name.png contains both) */}
      <div className="relative h-10">
        <Image
          src="/brand/logo-name.png"
          alt="DEUS QUANT"
          width={320}
          height={40}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
    </div>
  )
}
