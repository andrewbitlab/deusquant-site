import { DashboardHeader } from '@/components/dashboard/Header'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getAllStrategies, type StrategyData } from '@/lib/data/loader'
import { isDatabaseConfigured } from '@/lib/data/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function DashboardPage() {
  let strategies: StrategyData[] = []
  let loadError: string | null = null

  if (!isDatabaseConfigured()) {
    loadError = 'DATABASE_URL is not configured in the deployment environment'
  } else {
    try {
      strategies = await getAllStrategies()
    } catch (error) {
      console.error('Failed to load dashboard strategies:', error)
      loadError = 'Unable to load strategy data from database'
    }
  }

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

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {loadError && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadError}
            </div>
          )}
          <DashboardClient strategies={strategies} />
        </div>
      </div>
    </>
  )
}
