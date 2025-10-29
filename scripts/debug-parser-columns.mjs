import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

// Find Transakcje table
let headerRow = -1
for (let i = 18000; i < 18200; i++) {
  const row = data[i]
  const firstCell = String(row[0] || '').toLowerCase()

  if (firstCell.includes('transakcje') && !firstCell.includes('wszystkie')) {
    if (i + 1 < data.length) {
      const nextRow = String(data[i + 1][0] || '').toLowerCase()
      if (nextRow.includes('czas') || nextRow.includes('time')) {
        headerRow = i + 1
        break
      }
    }
  }
}

console.log(`Header row: ${headerRow}`)
console.log(`\nHeader columns:`)
const header = data[headerRow]
header.slice(0, 13).forEach((h, i) => {
  console.log(`  [${i}]: "${h}"`)
})

console.log(`\nFirst 5 data rows:\n`)
for (let i = headerRow + 1; i < headerRow + 6; i++) {
  const row = data[i]
  console.log(`Row ${i}:`)
  console.log(`  [0] Time:       "${row[0]}"`)
  console.log(`  [1] Deal#:      "${row[1]}"`)
  console.log(`  [2] Symbol:     "${row[2]}"`)
  console.log(`  [3] Typ:        "${row[3]}"`)
  console.log(`  [4] Kierunek:   "${row[4]}"`)
  console.log(`  [5] Volume:     "${row[5]}"`)
  console.log(`  [6] Price:      "${row[6]}"`)
  console.log(`  [7] Order:      "${row[7]}"`)
  console.log(`  [10] Profit:    "${row[10]}"`)
  console.log()
}
