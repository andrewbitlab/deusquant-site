import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BacktestReportPageProps {
  params: {
    magicNumber: string
  }
}

export function generateMetadata({ params }: BacktestReportPageProps): Metadata {
  const { magicNumber } = params
  const title = `Strategy ${magicNumber} MT5 Backtest Report`
  const description = `Raw MetaTrader 5 backtest report for Deus Quant strategy ${magicNumber}, including strategy tester metrics, trade statistics and MAE/MFE chart analysis.`

  return {
    title,
    description,
    alternates: {
      canonical: `/dashboard/backtest/${magicNumber}`,
    },
    openGraph: {
      title,
      description,
      url: `/dashboard/backtest/${magicNumber}`,
      type: 'article',
    },
  }
}

export default function BacktestReportPage({ params }: BacktestReportPageProps) {
  const { magicNumber } = params

  try {
    // Read HTML report file from data directory (UTF-16 LE encoding from MT5)
    const filePath = join(process.cwd(), 'data', 'backtest', 'html', `${magicNumber}.html`)
    let htmlContent = readFileSync(filePath, 'utf16le')

    // Check if MAE/MFE chart image exists
    const mafePath = join(process.cwd(), 'data', 'backtest', 'html', `${magicNumber}-mafe.png`)
    const hasMafeChart = existsSync(mafePath)

    // Rewrite image paths to use our API route
    // Replace src="filename.png" with src="/api/backtest/images/filename.png"
    htmlContent = htmlContent.replace(
      /src="([^"]+\.png)"/gi,
      'src="/api/backtest/images/$1"'
    )

    return (
      <div className="min-h-screen bg-bg-secondary">
        {/* Header with breadcrumbs and back button */}
        <div className="bg-white border-b border-border-light">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <nav className="text-sm text-text-muted mb-1">
                  <Link href="/dashboard" className="hover:text-deus-gray transition-colors">
                    Dashboard
                  </Link>
                  {' / '}
                  <span className="text-text-primary">Backtest Report</span>
                </nav>
                <h1 className="font-display text-2xl font-bold text-deus-gray">
                  Strategy {magicNumber} - Backtest Report
                </h1>
              </div>
              <Link
                href="/dashboard"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* MAE/MFE Chart (if available) */}
        {hasMafeChart && (
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <div className="bg-white rounded-lg border border-border-light shadow-deus-sm p-6">
              <h2 className="font-display text-lg font-semibold mb-4 text-deus-gray">
                MAE/MFE Analysis
              </h2>
              {/* This chart is generated externally and served via a local API route with dynamic sizing. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/backtest/images/${magicNumber}-mafe.png`}
                alt={`MAE/MFE Chart for Strategy ${magicNumber}`}
                className="mx-auto"
              />
            </div>
          </div>
        )}

        {/* HTML Report Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg border border-border-light shadow-deus-sm p-6">
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              className="backtest-report"
            />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error(`Failed to load backtest report for strategy ${magicNumber}:`, error)
    notFound()
  }
}
