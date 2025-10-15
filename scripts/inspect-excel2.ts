// Inspect Excel file structure - more rows
import { readFileSync } from 'fs'
import * as XLSX from 'xlsx'

const filePath = './data/backtest/202501027.xlsx'
const buffer = readFileSync(filePath)
const workbook = XLSX.read(buffer, { type: 'buffer' })

const sheet = workbook.Sheets['Sheet1']
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

console.log('Searching for statistics and transaction sections...\n')

// Look for key sections
for (let i = 30; i < Math.min(200, data.length); i++) {
  const row = data[i]
  const firstCell = String(row[0] || '').toLowerCase()
  const thirdCell = String(row[3] || '').toLowerCase()

  if (firstCell.includes('wyniki') || firstCell.includes('result') ||
      thirdCell.includes('wyniki') || thirdCell.includes('result') ||
      firstCell.includes('historia') || firstCell.includes('history') ||
      firstCell.includes('transak') || firstCell.includes('order') ||
      firstCell.includes('zysk') || firstCell.includes('profit') ||
      firstCell.includes('drawdown')) {
    console.log(`\n=== ROW ${i} (Potential section header) ===`)
    console.log(row.slice(0, 15))

    // Show next 10 rows
    console.log('\nNext 10 rows:')
    for (let j = i + 1; j < Math.min(i + 11, data.length); j++) {
      console.log(`Row ${j}:`, data[j].slice(0, 10))
    }

    console.log('')
  }
}
