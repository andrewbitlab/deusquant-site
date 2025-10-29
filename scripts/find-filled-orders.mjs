import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

console.log('=== SEARCHING FOR FILLED ORDERS ===\n')

// Start from row 109 (after header)
let foundCount = 0
for (let i = 110; i < data.length && foundCount < 20; i++) {
  const row = data[i]
  const status = String(row[11] || '').toLowerCase()

  // Look for filled/executed orders
  if (status && !status.includes('canceled') && row[0] && row[9]) {
    console.log(`\nRow ${i}:`)
    console.log(`  Open Time:  ${row[0]}`)
    console.log(`  Order #:    ${row[1]}`)
    console.log(`  Type:       ${row[3]}`)
    console.log(`  Volume:     ${row[4]}`)
    console.log(`  Price:      ${row[6]}`)
    console.log(`  SL:         ${row[7]}`)
    console.log(`  TP:         ${row[8]}`)
    console.log(`  Close Time: ${row[9]}`)
    console.log(`  Status:     ${row[11]}`)
    console.log(`  Comment:    ${row[12]}`)

    // Calculate holding time
    const openTime = new Date(row[0])
    const closeTime = new Date(row[9])
    const diffMs = closeTime - openTime
    const diffHours = diffMs / (1000 * 60 * 60)
    console.log(`  Holding:    ${diffHours.toFixed(2)} hours`)

    foundCount++
  }

  // Stop if we reach another section
  if (String(row[0]).toLowerCase().includes('transakcje') && i > 200) {
    break
  }
}

console.log(`\n\nFound ${foundCount} filled orders`)
