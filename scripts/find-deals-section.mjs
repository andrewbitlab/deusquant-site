import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

console.log(`Total rows: ${data.length}\n`)

// Find "Transakcje" section
for (let i = 0; i < data.length; i++) {
  const row = data[i]
  const firstCell = String(row[0] || '').toLowerCase()

  if (firstCell.includes('transakcje') || firstCell.includes('zlecenia')) {
    console.log(`\n=== Found at row ${i}: ${row[0]} ===`)
    console.log(`Showing rows ${i} to ${i + 20}:\n`)

    for (let j = i; j < Math.min(i + 20, data.length); j++) {
      console.log(`Row ${j}:`, data[j].slice(0, 13))
    }
    break
  }
}
