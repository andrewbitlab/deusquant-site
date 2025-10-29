import { readFileSync } from 'fs'
import { load } from 'cheerio'

const html = readFileSync('data/backtest/html/6.html', 'utf-8')
const $ = load(html)

console.log('=== ANALYZING HTML REPORT ===\n')

// Find all tables
const tables = $('table')
console.log(`Found ${tables.length} tables\n`)

// Look for tables with transaction/deal data
tables.each((i, table) => {
  const headers = $(table).find('th').map((_, el) => $(el).text().trim()).get()

  // Check if this looks like a deals/positions table
  if (headers.some(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('czas'))) {
    console.log(`\nTable ${i + 1}:`)
    console.log(`Headers:`, headers.slice(0, 15))

    // Get first 5 data rows
    const rows = $(table).find('tr').slice(1, 6)
    rows.each((j, row) => {
      const cells = $(row).find('td').map((_, el) => $(el).text().trim()).get()
      console.log(`  Row ${j + 1}:`, cells.slice(0, 10))
    })
  }
})

// Look for specific holding time information
console.log('\n\n=== SEARCHING FOR HOLDING TIME INFO ===\n')

const text = $.text()
if (text.includes('Holding') || text.includes('Duration')) {
  console.log('Found holding time references in HTML')
}

// Search for avgHoldingTime or similar metrics
const metrics = [
  'avgHoldingTime', 'minHoldingTime', 'maxHoldingTime',
  'Average holding', 'Minimum holding', 'Maximum holding',
  'Średni czas', 'Minimalny czas', 'Maksymalny czas'
]

for (const metric of metrics) {
  if (text.toLowerCase().includes(metric.toLowerCase())) {
    console.log(`Found metric: ${metric}`)

    // Try to find the value near this text
    const regex = new RegExp(`${metric}[^\\d]+(\\d+[:\\d]+)`, 'i')
    const match = text.match(regex)
    if (match) {
      console.log(`  Value: ${match[1]}`)
    }
  }
}
