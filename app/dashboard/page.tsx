import { DashboardHeader } from '@/components/dashboard/Header'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getAllStrategies } from '@/lib/data/loader'

// Revalidate every 1 hour (3600 seconds) - ISR with cache
export const revalidate = 3600

export default async function DashboardPage() {
  // Load all strategies from data directory
  // This will be cached and revalidated every hour
  const strategies = await getAllStrategies()

  // Find the latest transaction date from all strategies
  let latestDate = ''
  for (const strategy of strategies) {
    for (const point of strategy.profitCurve) {
      if (!latestDate || point.date > latestDate) {
        latestDate = point.date
      }
    }
  }

  return (
    <>
      <h1 className="sr-only">Deus Quant Portfolio Dashboard</h1>

      <div className="min-h-screen bg-bg-secondary">
        <DashboardHeader lastTransactionDate={latestDate} />

        <div className="container mx-auto px-6 py-8">
          <DashboardClient strategies={strategies} />
        </div>
      </div>
    </>
  )
}
