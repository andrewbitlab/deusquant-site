// Test script for MT5 Excel Parser
import { readFileSync } from 'fs'
import { MT5ExcelParser } from '../lib/parsers/mt5/excel-parser'

async function testParser() {
  try {
    console.log('Testing MT5 Excel Parser...\n')

    // Read the test file
    const filePath = './data/backtest/202501027.xlsx'
    const buffer = readFileSync(filePath)
    const file = new File([buffer], '202501027.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // Parse the file
    const result = await MT5ExcelParser.parseFile(file)

    if (!result.success) {
      console.error('❌ Parse failed:', result.error)
      process.exit(1)
    }

    const { data } = result

    // Display results
    console.log('✅ Parse successful!\n')
    console.log('=== METADATA ===')
    console.log(`Magic Number: ${data.metadata.magicNumber}`)
    console.log(`Currency: ${data.metadata.currency}`)
    console.log(`Broker: ${data.metadata.broker || 'N/A'}`)
    console.log(`Leverage: ${data.metadata.leverage || 'N/A'}`)

    console.log('\n=== SUMMARY ===')
    console.log(`Symbol: ${data.summary.symbol}`)
    console.log(`Period: ${data.summary.period}`)
    console.log(`Total Trades: ${data.summary.totalTrades}`)
    console.log(`Total Net Profit: $${data.summary.totalNetProfit.toFixed(2)}`)
    console.log(`Profit Factor: ${data.summary.profitFactor.toFixed(2)}`)
    console.log(`Win Rate: ${data.summary.winRate.toFixed(2)}%`)
    console.log(`Max Drawdown: $${data.summary.maximalDrawdown.toFixed(2)} (${data.summary.maximalDrawdownPercent.toFixed(2)}%)`)
    console.log(`Sharpe Ratio: ${data.summary.sharpeRatio?.toFixed(2) || 'N/A'}`)

    console.log('\n=== TRANSACTIONS ===')
    console.log(`Total Transactions: ${data.transactions.length}`)
    if (data.transactions.length > 0) {
      console.log(`First Trade: ${data.transactions[0].openTime.toISOString()}`)
      console.log(`Last Trade: ${data.transactions[data.transactions.length - 1].openTime.toISOString()}`)
    }

    console.log('\n=== MONTHLY RETURNS ===')
    if (data.monthlyReturns && data.monthlyReturns.size > 0) {
      const months = Array.from(data.monthlyReturns.entries()).slice(0, 5)
      months.forEach(([month, return_]) => {
        console.log(`${month}: ${return_.toFixed(2)}%`)
      })
      if (data.monthlyReturns.size > 5) {
        console.log(`... and ${data.monthlyReturns.size - 5} more months`)
      }
    }

    console.log('\n=== EQUITY CURVE ===')
    if (data.dailyEquity && data.dailyEquity.length > 0) {
      console.log(`Data points: ${data.dailyEquity.length}`)
      console.log(`Initial equity: $${data.dailyEquity[0].equity.toFixed(2)}`)
      console.log(`Final equity: $${data.dailyEquity[data.dailyEquity.length - 1].equity.toFixed(2)}`)
    }

    console.log('\n✅ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testParser()
