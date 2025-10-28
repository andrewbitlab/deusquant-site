import { NextResponse } from 'next/server'
import { prisma } from '@/lib/data/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Health check endpoint for monitoring database connectivity
 * Returns 200 OK if database is reachable, 503 Service Unavailable otherwise
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`

    // Get basic stats
    const strategiesCount = await prisma.strategy.count({
      where: { isActive: true },
    })

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          provider: 'postgresql',
          activeStrategies: strategiesCount,
        },
        service: 'deus-quant-portfolio',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        service: 'deus-quant-portfolio',
      },
      { status: 503 }
    )
  }
}
