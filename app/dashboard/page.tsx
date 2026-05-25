import type { Metadata } from 'next'
import { DashboardHeader } from '@/components/dashboard/Header'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getAllStrategies, type StrategyData } from '@/lib/data/loader'
import { isDatabaseConfigured } from '@/lib/data/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const metadata: Metadata = {
  title: 'Algorithmic Trading Strategy Portfolio Dashboard',
  description:
    'Public Deus Quant dashboard for algorithmic trading strategy research: MetaTrader 5 backtests, forward tests, equity curves, drawdown, monthly returns and portfolio-level metrics.',
  alternates: {
    canonical: '/dashboard',
  },
  openGraph: {
    title: 'Deus Quant Algorithmic Trading Strategy Portfolio Dashboard',
    description:
      'Explore MT5 strategy reports, forward-test monitoring, equity curves, drawdown analysis and Quant R&D automation metrics.',
    url: '/dashboard',
    type: 'website',
  },
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            '@id': 'https://deusquant.com/dashboard#strategy-portfolio-dataset',
            name: 'Deus Quant Algorithmic Trading Strategy Portfolio',
            description:
              'Public dashboard of algorithmic trading strategy research with MetaTrader 5 backtests, forward-test monitoring, equity curves, drawdown and monthly return analysis.',
            url: 'https://deusquant.com/dashboard',
            creator: {
              '@id': 'https://deusquant.com/#organization',
            },
            keywords: [
              'algorithmic trading strategies',
              'MetaTrader 5 backtesting',
              'MQL5 trading robots',
              'quantitative trading portfolio',
              'forward test monitoring',
              'equity curve analysis',
              'drawdown analysis',
            ],
            dateModified: latestDate || undefined,
            variableMeasured: [
              'Total profit',
              'Win rate',
              'Profit factor',
              'Maximum drawdown',
              'Sharpe ratio',
              'Monthly returns',
            ],
            measurementTechnique: [
              'MetaTrader 5 strategy tester report parsing',
              'Forward-test transaction analysis',
              'Portfolio-level strategy aggregation',
            ],
          }),
        }}
      />
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
