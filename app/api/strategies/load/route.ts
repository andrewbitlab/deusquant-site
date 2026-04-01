import { NextResponse } from 'next/server'
import { getAllStrategies } from '@/lib/data/loader'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const strategies = await getAllStrategies()

    return NextResponse.json({
      success: true,
      count: strategies.length,
      strategies,
    })
  } catch (error) {
    console.error('Failed to load strategies:', error)

    const isConfigError =
      error instanceof Error && error.message.includes('DATABASE_URL')

    return NextResponse.json(
      {
        success: false,
        error: isConfigError
          ? 'DATABASE_URL is not configured'
          : 'Failed to load strategies from database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isConfigError ? 503 : 500 }
    )
  }
}
