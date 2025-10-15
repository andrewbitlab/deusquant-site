// Inspect Excel file structure
import { readFileSync } from 'fs'
import * as XLSX from 'xlsx'

const filePath = './data/backtest/202501027.xlsx'
const buffer = readFileSync(filePath)
const workbook = XLSX.read(buffer, { type: 'buffer' })

console.log('=== WORKBOOK INFO ===')
console.log('Sheet Names:', workbook.SheetNames)
console.log('')

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n=== SHEET: ${sheetName} ===`)
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

  console.log(`Total rows: ${data.length}`)
  console.log('\nFirst 30 rows:')
  data.slice(0, 30).forEach((row, i) => {
    console.log(`Row ${i}:`, row.slice(0, 10)) // Show first 10 columns
  })
})
