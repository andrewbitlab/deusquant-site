import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

console.log('=== ANALYZING TRANSAKCJE (DEALS) TABLE ===\n')

// Find "Transakcje" section (around row 18078)
let headerRow = -1
for (let i = 18000; i < 18200; i++) {
  const row = data[i]
  const firstCell = String(row[0] || '').toLowerCase()

  if (firstCell.includes('transakcje') && !firstCell.includes('wszystkie')) {
    // Next row should be header
    if (i + 1 < data.length) {
      const nextRow = String(data[i + 1][0] || '').toLowerCase()
      if (nextRow.includes('czas') || nextRow.includes('time')) {
        headerRow = i + 1
        break
      }
    }
  }
}

if (headerRow === -1) {
  console.log('Could not find Transakcje table header')
  process.exit(1)
}

console.log(`Found Transakcje header at row ${headerRow}`)
console.log(`Header:`, data[headerRow].slice(0, 13))
console.log()

// Parse first 20 deals
console.log('First 20 deals:\n')
const deals = []
for (let i = headerRow + 1; i < headerRow + 21; i++) {
  const row = data[i]
  if (!row || !row[0]) continue

  const deal = {
    time: row[0],
    dealNum: row[1],
    symbol: row[2],
    type: row[3],
    direction: row[4],
    volume: row[5],
    price: row[6],
    order: row[7],
    commission: row[8],
    swap: row[9],
    profit: row[10],
    balance: row[11],
    comment: row[12]
  }

  deals.push(deal)

  console.log(`Deal #${deal.dealNum}:`)
  console.log(`  Time: ${deal.time}`)
  console.log(`  Type: ${deal.type} ${deal.direction}`)
  console.log(`  Volume: ${deal.volume}`)
  console.log(`  Price: ${deal.price}`)
  console.log(`  Profit: ${deal.profit}`)
  console.log(`  Commission: ${deal.commission}`)
  console.log(`  Swap: ${deal.swap}`)
  console.log(`  Order: ${deal.order}`)
  console.log(`  Comment: ${deal.comment}`)
  console.log()
}

console.log('\n=== PATTERN ANALYSIS ===\n')

// Check if deals come in buy/sell pairs
const buyDeals = deals.filter(d => String(d.direction || '').toLowerCase() === 'buy')
const sellDeals = deals.filter(d => String(d.direction || '').toLowerCase() === 'sell')

console.log(`Buy deals: ${buyDeals.length}`)
console.log(`Sell deals: ${sellDeals.length}`)

// Look for position pairs based on order number
console.log('\nLooking for position reconstruction from deals...\n')

for (let i = 0; i < Math.min(10, deals.length - 1); i += 2) {
  const deal1 = deals[i]
  const deal2 = deals[i + 1]

  if (!deal1 || !deal2) continue

  console.log(`Position ${i / 2 + 1}:`)
  console.log(`  Open:  ${deal1.time} (${deal1.type} ${deal1.direction})`)
  console.log(`  Close: ${deal2.time} (${deal2.type} ${deal2.direction})`)

  const openTime = new Date(deal1.time)
  const closeTime = new Date(deal2.time)
  const holdingHours = (closeTime - openTime) / (1000 * 60 * 60)

  console.log(`  Holding: ${holdingHours.toFixed(2)} hours`)
  console.log(`  Profit: ${deal2.profit}`)
  console.log(`  Order link: Deal1 order#${deal1.order}, Deal2 order#${deal2.order}`)
  console.log()
}
