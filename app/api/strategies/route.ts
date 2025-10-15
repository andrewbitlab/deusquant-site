import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export async function GET() {
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
  try {
    const data = await request.json()

    const strategy = await prisma.strategy.create({
      data: {
        magicNumber: data.magicNumber,
        name: data.name,
        symbol: data.symbol,
        timeframe: data.timeframe,
        backtestStart: new Date(data.backtestStart),
        backtestEnd: new Date(data.backtestEnd),
        backtestMetrics: JSON.stringify(data.backtestMetrics),
        backtestEquity: JSON.stringify(data.backtestEquity),
        status: data.status || 'BACKTEST',
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
