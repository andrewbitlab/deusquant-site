import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured, prisma } from '@/lib/data/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured' },
      { status: 503 }
    )
  }

  try {
    const strategies = await prisma.strategy.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ strategies })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured' },
      { status: 503 }
    )
  }

  try {
    const data = await request.json()

    const strategy = await prisma.strategy.create({
      data: {
        id: data.id || `strategy-${data.magicNumber}-${Date.now()}`,
        magicNumber: data.magicNumber,
        name: data.name,
        symbol: data.symbol,
        timeframe: data.timeframe,
        backtestStart: new Date(data.backtestStart),
        backtestEnd: new Date(data.backtestEnd),
        backtestMetrics: JSON.stringify(data.backtestMetrics),
        backtestEquity: JSON.stringify(data.backtestEquity),
        status: data.status || 'BACKTEST',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ strategy }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create strategy' },
      { status: 500 }
    )
  }
}
