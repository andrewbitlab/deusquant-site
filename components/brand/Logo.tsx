'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center', className)}>
      {/* Complete logo with icon + text (logo-name.png contains both) */}
      <div className="relative h-12 hover:opacity-90 transition-opacity cursor-pointer">
        <Image
          src="/brand/logo-name.png"
          alt="DEUS QUANT"
          width={384}
          height={48}
          className="h-full w-auto object-contain m-0 p-0"
          priority
        />
      </div>
    </Link>
  )
}
