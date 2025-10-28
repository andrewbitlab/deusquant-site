'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/common/LoadingScreen'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Prefetch dashboard to start loading data in background
    router.prefetch('/dashboard')

    // Navigate immediately - the dashboard loading.tsx will show the loader
    // until all data is loaded and ready
    router.push('/dashboard')
  }, [router])

  // Show beautiful loader while initial redirect happens
  // Then dashboard's loading.tsx takes over until data is ready
  return <LoadingScreen />
}
