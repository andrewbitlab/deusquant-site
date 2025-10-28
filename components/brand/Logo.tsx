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
      {/* Complete logo with icon + text - Next.js will auto-serve WebP if supported */}
      <div className="relative h-10 sm:h-12 hover:opacity-90 transition-opacity cursor-pointer">
        <Image
          src="/brand/logo-name.webp"
          alt="DEUS QUANT"
          width={200}
          height={48}
          className="h-10 sm:h-12 w-auto object-contain"
          priority
        />
      </div>
    </Link>
  )
}
