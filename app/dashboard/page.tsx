import { DashboardHeader } from '@/components/dashboard/Header'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getAllStrategies } from '@/lib/data/loader'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Load all strategies from data directory
  const strategies = await getAllStrategies()

  return (
    <div className="min-h-screen bg-bg-secondary">
      <DashboardHeader />

      <div className="container mx-auto px-6 py-8">
        <DashboardClient strategies={strategies} />
      </div>
    </div>
  )
}
