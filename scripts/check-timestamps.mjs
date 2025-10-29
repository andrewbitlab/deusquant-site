import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const transactions = await prisma.transaction.findMany({
    where: {
      strategy: { magicNumber: 6 },
      type: { in: ['BUY', 'SELL'] },
      isForwardTest: false
    },
    select: {
      orderId: true,
      type: true,
      openTime: true,
      closeTime: true,
      profit: true
    },
    take: 20,
    orderBy: { orderId: 'asc' }
  })

  console.log(`Checking first 20 transactions:\n`)

  transactions.forEach(tx => {
    console.log(`Order ${tx.orderId} (${tx.type}):`)
    console.log(`  openTime:  ${tx.openTime?.toISOString() || 'NULL'}`)
    console.log(`  closeTime: ${tx.closeTime?.toISOString() || 'NULL'}`)

    if (tx.openTime && tx.closeTime) {
      const diffMs = tx.closeTime.getTime() - tx.openTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      console.log(`  Duration: ${diffHours.toFixed(4)} hours (${diffMs} ms)`)
      console.log(`  Profit: $${tx.profit}`)
    } else {
      console.log(`  Duration: N/A (missing timestamp)`)
    }
    console.log()
  })

  // Count transactions with null closeTime
  const nullCloseTime = await prisma.transaction.count({
    where: {
      strategy: { magicNumber: 6 },
      type: { in: ['BUY', 'SELL'] },
      isForwardTest: false,
      closeTime: null
    }
  })

  console.log(`Transactions with NULL closeTime: ${nullCloseTime}`)

  await prisma.$disconnect()
}

check().catch(console.error)
