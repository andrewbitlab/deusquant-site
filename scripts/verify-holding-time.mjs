import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function verify() {
  const transactions = await prisma.transaction.findMany({
    where: {
      strategy: { magicNumber: 6 },
      type: { in: ['BUY', 'SELL'] },
      isForwardTest: false,
      closeTime: { not: null }
    },
    select: {
      orderId: true,
      openTime: true,
      closeTime: true,
      profit: true,
      commission: true,
      swap: true
    },
    orderBy: { openTime: 'asc' }
  })

  console.log(`Total closed trades: ${transactions.length}`)

  // Calculate holding times
  const holdingTimes = transactions.map(tx => {
    const durationMs = tx.closeTime.getTime() - tx.openTime.getTime()
    const holdingTimeHours = durationMs / (1000 * 60 * 60)
    const totalProfit = tx.profit + tx.commission + tx.swap
    return {
      orderId: tx.orderId,
      holdingTimeHours,
      profit: tx.profit,
      commission: tx.commission,
      swap: tx.swap,
      totalProfit
    }
  })

  // Statistics
  const maxHoldingTime = Math.max(...holdingTimes.map(t => t.holdingTimeHours))
  const minHoldingTime = Math.min(...holdingTimes.map(t => t.holdingTimeHours))
  const avgHoldingTime = holdingTimes.reduce((sum, t) => sum + t.holdingTimeHours, 0) / holdingTimes.length

  console.log(`\nHolding Time Statistics:`)
  console.log(`  Min: ${minHoldingTime.toFixed(2)} hours`)
  console.log(`  Max: ${maxHoldingTime.toFixed(2)} hours`)
  console.log(`  Avg: ${avgHoldingTime.toFixed(2)} hours`)

  // Check if profit includes commission/swap
  console.log(`\nProfit Calculation Check (first 5 trades):`)
  holdingTimes.slice(0, 5).forEach(t => {
    console.log(`  Trade ${t.orderId}:`)
    console.log(`    Profit: $${t.profit.toFixed(2)}`)
    console.log(`    Commission: $${t.commission.toFixed(2)}`)
    console.log(`    Swap: $${t.swap.toFixed(2)}`)
    console.log(`    Total: $${t.totalProfit.toFixed(2)}`)
  })

  // Count profitable vs losing
  const profitable = holdingTimes.filter(t => t.totalProfit > 0).length
  const losing = holdingTimes.filter(t => t.totalProfit <= 0).length

  console.log(`\nTrade Results:`)
  console.log(`  Profitable: ${profitable}`)
  console.log(`  Losing: ${losing}`)

  // Top 10 longest holding times
  console.log(`\nTop 10 longest holding times:`)
  holdingTimes
    .sort((a, b) => b.holdingTimeHours - a.holdingTimeHours)
    .slice(0, 10)
    .forEach((t, i) => {
      console.log(`  ${i + 1}. Order ${t.orderId}: ${t.holdingTimeHours.toFixed(2)} hours, Profit: $${t.totalProfit.toFixed(2)}`)
    })

  await prisma.$disconnect()
}

verify().catch(console.error)
