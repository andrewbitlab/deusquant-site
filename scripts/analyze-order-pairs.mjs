import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

console.log('=== ANALYZING ORDER PAIRS ===\n')
console.log('Looking for consecutive filled orders to understand position structure...\n')

// Collect all filled orders
const filledOrders = []
for (let i = 110; i < data.length; i++) {
  const row = data[i]
  const status = String(row[11] || '').toLowerCase()

  if (status === 'filled' && row[0]) {
    filledOrders.push({
      rowNum: i,
      openTime: row[0],
      orderNum: row[1],
      type: String(row[3] || ''),
      volume: row[4],
      price: row[6],
      closeTime: row[9],
      comment: String(row[12] || ''),
      status: row[11]
    })
  }

  if (String(row[0]).toLowerCase().includes('transakcje') && i > 200) {
    break
  }
}

console.log(`Found ${filledOrders.length} filled orders\n`)

// Analyze first 10 pairs
console.log('First 10 filled orders:\n')
for (let i = 0; i < Math.min(10, filledOrders.length); i++) {
  const order = filledOrders[i]
  console.log(`${i + 1}. Order #${order.orderNum} (Row ${order.rowNum})`)
  console.log(`   Type: ${order.type}`)
  console.log(`   Open:  ${order.openTime}`)
  console.log(`   Close: ${order.closeTime}`)
  console.log(`   Comment: ${order.comment}`)

  const openTime = new Date(order.openTime)
  const closeTime = new Date(order.closeTime)
  const diffHours = (closeTime - openTime) / (1000 * 60 * 60)
  console.log(`   Time diff: ${diffHours.toFixed(2)} hours`)

  // Check if next order is related
  if (i + 1 < filledOrders.length) {
    const nextOrder = filledOrders[i + 1]
    console.log(`   Next order #${nextOrder.orderNum}: ${nextOrder.type} @ ${nextOrder.openTime}`)

    // Calculate time between this close and next open
    const thisClose = new Date(order.closeTime)
    const nextOpen = new Date(nextOrder.openTime)
    const timeBetween = (nextOpen - thisClose) / (1000 * 60 * 60)
    console.log(`   Time to next order: ${timeBetween.toFixed(2)} hours`)
  }
  console.log()
}

console.log('\n=== PATTERN ANALYSIS ===\n')
console.log('Looking for patterns:')
console.log('1. Are "buy stop" and "sell" orders paired?')
console.log('2. What is the relationship between order close time and position close time?\n')

// Check if orders come in buy/sell pairs
let buyStopCount = 0
let sellCount = 0
let otherCount = 0

for (const order of filledOrders) {
  const type = order.type.toLowerCase()
  if (type.includes('buy stop')) buyStopCount++
  else if (type === 'sell') sellCount++
  else otherCount++
}

console.log(`Buy stop orders: ${buyStopCount}`)
console.log(`Sell orders: ${sellCount}`)
console.log(`Other orders: ${otherCount}`)
console.log(`\nRatio: ${buyStopCount} buy stops to ${sellCount} sells`)

if (buyStopCount === sellCount) {
  console.log('✓ Orders appear to come in pairs!')
} else {
  console.log('✗ Orders do NOT come in exact pairs')
}
