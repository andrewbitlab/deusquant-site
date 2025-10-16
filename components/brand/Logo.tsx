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
      <div className="relative h-12">
        <Image
          src="/brand/logo-name.png"
          alt="DEUS QUANT"
          width={384}
          height={48}
          className="h-full w-auto object-contain m-0 p-0"
          priority
        />
      </div>
    </div>
  )
}
