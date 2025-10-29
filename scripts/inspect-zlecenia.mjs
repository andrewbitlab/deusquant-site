import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

console.log('=== ZLECENIA (ORDERS) TABLE ===\n')

// Start from row 108
const startRow = 108
console.log(`Rows ${startRow} to ${startRow + 20}:\n`)

for (let i = startRow; i < startRow + 21; i++) {
  const row = data[i]
  console.log(`Row ${i}:`)
  console.log(`  `, row.slice(0, 15))
  console.log()
}
