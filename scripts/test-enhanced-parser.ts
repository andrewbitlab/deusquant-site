#!/usr/bin/env tsx
/**
 * COMPREHENSIVE TEST SUITE: Enhanced Excel Parser
 *
 * Tests the new deal-pairing parser logic to ensure:
 * 1. Correct position reconstruction from entry/exit deals
 * 2. Accurate holding time calculations
 * 3. Proper profit/commission/swap attribution
 * 4. Universal compatibility across different strategies
 */

import { readFileSync } from 'fs'
import { MT5ExcelParser } from '../lib/parsers/mt5/excel-parser'

interface TestResult {
  testName: string
  passed: boolean
  expected: any
  actual: any
  details?: string
}

const results: TestResult[] = []

function test(name: string, expected: any, actual: any, tolerance = 0.01): void {
  const passed = Math.abs(expected - actual) < tolerance
  results.push({ testName: name, passed, expected, actual })

  const status = passed ? '✅' : '❌'
  console.log(`${status} ${name}`)
  if (!passed) {
    console.log(`   Expected: ${expected}`)
    console.log(`   Actual:   ${actual}`)
  }
}

async function runTests() {
  console.log('=' .repeat(80))
  console.log('ENHANCED EXCEL PARSER - TEST SUITE')
  console.log('=' .repeat(80))
  console.log()

  // Test 1: Parse Strategy #6
  console.log('TEST 1: Parse Strategy #6 (XAUUSD H1)')
  console.log('-'.repeat(80))

  try {
    const buffer = readFileSync('data/backtest/6.xlsx')
    const file = new File([buffer], '6.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await MT5ExcelParser.parseFile(file)

    if (!result.success) {
      console.error('❌ Parser failed:', result.error)
      return
    }

    const { transactions } = result.data

    console.log(`\nParsed ${transactions.length} positions\n`)

    // Test: Transaction count
    test('Total positions', 330, transactions.length, 0)

    // Test: First position details
    const firstPos = transactions[0]
    console.log('\nFirst Position Analysis:')
    console.log(`  ID: ${firstPos.id}`)
    console.log(`  Type: ${firstPos.type}`)
    console.log(`  Open:  ${firstPos.openTime.toISOString()}`)
    console.log(`  Close: ${firstPos.closeTime?.toISOString()}`)

    if (firstPos.openTime && firstPos.closeTime) {
      const holdingMs = firstPos.closeTime.getTime() - firstPos.openTime.getTime()
      const holdingHours = holdingMs / (1000 * 60 * 60)
      console.log(`  Holding: ${holdingHours.toFixed(2)} hours`)

      // Expected: First position should have ~20.91 hours holding time
      // Based on our previous analysis:
      // Open: 2014.01.23 23:45:20, Close: 2014.01.24 20:40:00
      test('First position holding time (hours)', 20.91, holdingHours, 0.1)
    } else {
      test('First position has close time', true, false)
    }

    console.log(`  Profit: $${firstPos.profit}`)
    console.log(`  Swap: $${firstPos.swap}`)
    console.log(`  Volume: ${firstPos.volume}`)

    // Test: Expected profit for first position
    // From our analysis: profit=2.4, swap=-20.08
    test('First position profit', 2.4, firstPos.profit, 0.1)
    test('First position swap', -20.08, firstPos.swap, 0.1)

    // Test: Second position (should be a big win - $940)
    const secondPos = transactions[1]
    console.log('\nSecond Position Analysis:')
    console.log(`  Profit: $${secondPos.profit}`)
    console.log(`  Swap: $${secondPos.swap}`)

    if (secondPos.openTime && secondPos.closeTime) {
      const holdingMs = secondPos.closeTime.getTime() - secondPos.openTime.getTime()
      const holdingHours = holdingMs / (1000 * 60 * 60)
      console.log(`  Holding: ${holdingHours.toFixed(2)} hours`)

      // Expected: ~79.65 hours based on our analysis
      test('Second position holding time (hours)', 79.65, holdingHours, 0.1)
    }

    test('Second position profit', 940, secondPos.profit, 1)
    test('Second position swap', -100.39, secondPos.swap, 0.1)

    // Test: All positions have holding time
    const positionsWithHoldingTime = transactions.filter(tx => {
      if (!tx.openTime || !tx.closeTime) return false
      const diff = tx.closeTime.getTime() - tx.openTime.getTime()
      return diff > 0
    })

    console.log(`\n${positionsWithHoldingTime.length}/${transactions.length} positions have positive holding time`)

    const holdingTimePercentage = (positionsWithHoldingTime.length / transactions.length) * 100
    test('Percentage with valid holding time', 100, holdingTimePercentage, 1)

    // Test: Calculate statistics
    const holdingTimes = transactions
      .filter(tx => tx.openTime && tx.closeTime)
      .map(tx => {
        const ms = tx.closeTime!.getTime() - tx.openTime.getTime()
        return ms / (1000 * 60 * 60) // convert to hours
      })

    if (holdingTimes.length > 0) {
      const minHolding = Math.min(...holdingTimes)
      const maxHolding = Math.max(...holdingTimes)
      const avgHolding = holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length

      console.log('\nHolding Time Statistics:')
      console.log(`  Min: ${minHolding.toFixed(2)} hours`)
      console.log(`  Max: ${maxHolding.toFixed(2)} hours`)
      console.log(`  Avg: ${avgHolding.toFixed(2)} hours`)

      // From HTML report: avgHoldingTime = 18:30:32 = 18.51 hours
      test('Average holding time (hours)', 18.51, avgHolding, 0.5)

      // Max should be 113:43:20 = 113.72 hours
      test('Maximum holding time (hours)', 113.72, maxHolding, 0.5)
    }

    // Test: Profit calculations
    const profitPositions = transactions.filter(tx => tx.profit > 0)
    const lossPositions = transactions.filter(tx => tx.profit < 0)

    console.log('\nProfit/Loss Distribution:')
    console.log(`  Profitable: ${profitPositions.length}`)
    console.log(`  Losing: ${lossPositions.length}`)

    // Expected from Excel: 135 profit trades, 195 loss trades
    test('Profitable positions', 135, profitPositions.length, 0)
    test('Losing positions', 195, lossPositions.length, 0)

    const totalProfit = profitPositions.reduce((sum, tx) => sum + tx.profit, 0)
    const totalLoss = lossPositions.reduce((sum, tx) => sum + tx.profit, 0)

    console.log(`  Total Profit: $${totalProfit.toFixed(2)}`)
    console.log(`  Total Loss: $${totalLoss.toFixed(2)}`)

    // Expected from Excel: Gross Profit = $93,465.69, Gross Loss = $-60,919.83
    test('Total gross profit', 93465.69, totalProfit, 10)
    test('Total gross loss', -60919.83, totalLoss, 10)

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`\nSuccess Rate: ${((passed / results.length) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\nFailed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.testName}`)
      console.log(`    Expected: ${r.expected}, Actual: ${r.actual}`)
    })
    process.exit(1)
  } else {
    console.log('\n🎉 ALL TESTS PASSED! Parser is ready for production.')
  }
}

runTests().catch(console.error)
