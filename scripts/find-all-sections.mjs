import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const buffer = readFileSync('data/backtest/6.xlsx')
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

console.log(`Total rows: ${data.length}\n`)

// Find all sections
const sections = []
for (let i = 0; i < data.length; i++) {
  const row = data[i]
  const firstCell = String(row[0] || '').toLowerCase()

  if (firstCell && !firstCell.match(/^\s*$/)) {
    // Check if this looks like a section header (has text in first column, mostly empty after)
    const nonEmptyAfter = row.slice(1).filter(cell => cell !== '').length
    if (nonEmptyAfter < 3 && firstCell.length > 3) {
      sections.push({ row: i, text: row[0] })
    }
  }
}

console.log('Found sections:')
sections.forEach(s => {
  if (s.text.toLowerCase().includes('transakcje') ||
      s.text.toLowerCase().includes('zlecenia') ||
      s.text.toLowerCase().includes('umowa') ||
      s.text.toLowerCase().includes('czas')) {
    console.log(`  Row ${s.row}: ${s.text}`)
  }
})

// Look for the "Transakcje" table (should have header with "Czas", "Umowa", etc.)
console.log('\nLooking for table headers...')
for (let i = 100; i < Math.min(200, data.length); i++) {
  const row = data[i]
  const cells = row.slice(0, 13).map(c => String(c || '').toLowerCase())

  if (cells.some(c => c.includes('czas')) && cells.some(c => c.includes('umowa'))) {
    console.log(`\n===FOUND TABLE HEADER at row ${i}===`)
    console.log(`Header:`, row.slice(0, 13))
    console.log(`\nFirst 10 data rows:`)
    for (let j = i + 1; j < Math.min(i + 11, data.length); j++) {
      console.log(`Row ${j}:`, data[j].slice(0, 13))
    }
    break
  }
}
