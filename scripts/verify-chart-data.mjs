import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function verify() {
  // Check backtest only
  const backtest = await prisma.transaction.findMany({
    where: {
      strategy: { magicNumber: 6 },
      type: { in: ['BUY', 'SELL'] },
      isForwardTest: false
    },
    select: { openTime: true, profit: true }
  })

  console.log(`Total BACKTEST trades for strategy #6: ${backtest.length}`)

  const transactions = backtest

  // Count by hour (UTC+2 broker time)
  const hourly = {}
  for (let i = 0; i < 24; i++) hourly[i] = 0

  transactions.forEach(tx => {
    const utcHour = tx.openTime.getUTCHours()
    const brokerHour = (utcHour + 2) % 24
    hourly[brokerHour]++
  })

  console.log('\nTop 5 hours by entry count:')
  Object.entries(hourly)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([hour, count]) => {
      const h = hour.toString().padStart(2,'0')
      console.log(`  Hour ${h}: ${count} entries`)
    })

  // Count by day of week (UTC+2 broker time)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daily = {}
  for (let i = 0; i < 7; i++) daily[i] = 0

  transactions.forEach(tx => {
    const brokerTime = new Date(tx.openTime.getTime() + 2 * 60 * 60 * 1000)
    const day = brokerTime.getUTCDay()
    daily[day]++
  })

  console.log('\nEntries by day of week:')
  Object.entries(daily)
    .forEach(([day, count]) => {
      console.log(`  ${days[day]}: ${count} entries`)
    })

  await prisma.$disconnect()
}

verify().catch(console.error)
