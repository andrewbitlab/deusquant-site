import { NextResponse } from 'next/server'
import { getAllStrategies } from '@/lib/data/loader'

export const dynamic = 'force-dynamic'

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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load strategies from files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
