'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/common/LoadingScreen'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after a brief moment
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return <LoadingScreen />
}
