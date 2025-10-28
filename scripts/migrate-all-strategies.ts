#!/usr/bin/env tsx
/**
 * MASS DATABASE MIGRATION SCRIPT
 *
 * Re-imports ALL strategies using enhanced Excel parser with deal-pairing logic.
 * This fixes holding time calculations for all strategies.
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { MT5ExcelParser } from '../lib/parsers/mt5/excel-parser'
import { join } from 'path'

const prisma = new PrismaClient()

interface MigrationResult {
  magicNumber: number
  name: string
  status: 'success' | 'skipped' | 'error'
  beforeCount: number
  afterCount: number
  beforeAvgHolding: number
  afterAvgHolding: number
  error?: string
}

async function getHoldingTimeStats(strategyId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { strategyId },
    select: { openTime: true, closeTime: true },
  })

  if (transactions.length === 0) {
    return { count: 0, avgHolding: 0 }
  }

  let totalHoldingHours = 0
  let validCount = 0

  for (const tx of transactions) {
    if (tx.openTime && tx.closeTime) {
      const holdingMs = tx.closeTime.getTime() - tx.openTime.getTime()
      const holdingHours = holdingMs / (1000 * 60 * 60)
      if (holdingHours > 0) {
        totalHoldingHours += holdingHours
        validCount++
      }
    }
  }

  const avgHolding = validCount > 0 ? totalHoldingHours / validCount : 0
  return { count: transactions.length, avgHolding }
}

async function migrateStrategy(magicNumber: number): Promise<MigrationResult> {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Processing Strategy #${magicNumber}`)
  console.log('='.repeat(80))

  // Find strategy
  const strategy = await prisma.strategy.findUnique({
    where: { magicNumber },
  })

  if (!strategy) {
    console.log(`❌ Strategy #${magicNumber} not found in database`)
    return {
      magicNumber,
      name: 'NOT FOUND',
      status: 'error',
      beforeCount: 0,
      afterCount: 0,
      beforeAvgHolding: 0,
      afterAvgHolding: 0,
      error: 'Strategy not found in database',
    }
  }

  console.log(`Strategy: ${strategy.name}`)

  // Check if Excel file exists
  const excelPath = `data/backtest/${magicNumber}.xlsx`
  if (!existsSync(excelPath)) {
    console.log(`⚠️  Excel file not found: ${excelPath}`)
    return {
      magicNumber,
      name: strategy.name,
      status: 'skipped',
      beforeCount: 0,
      afterCount: 0,
      beforeAvgHolding: 0,
      afterAvgHolding: 0,
      error: 'Excel file not found',
    }
  }

  // Get BEFORE stats
  const before = await getHoldingTimeStats(strategy.id)
  console.log(`Before: ${before.count} transactions, avg holding: ${before.avgHolding.toFixed(2)}h`)

  // Delete existing transactions
  console.log('Deleting existing transactions...')
  const deleteResult = await prisma.transaction.deleteMany({
    where: { strategyId: strategy.id },
  })
  console.log(`Deleted ${deleteResult.count} transactions`)

  // Re-import using enhanced parser
  try {
    console.log('Re-importing with enhanced parser...')
    const buffer = readFileSync(excelPath)
    const file = new File([buffer], `${magicNumber}.xlsx`, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const parseResult = await MT5ExcelParser.parseFile(file)

    if (!parseResult.success) {
      console.log(`❌ Parser failed: ${parseResult.error}`)
      return {
        magicNumber,
        name: strategy.name,
        status: 'error',
        beforeCount: before.count,
        afterCount: 0,
        beforeAvgHolding: before.avgHolding,
        afterAvgHolding: 0,
        error: String(parseResult.error),
      }
    }

    const { transactions: parsedTransactions } = parseResult.data
    console.log(`Parsed ${parsedTransactions.length} positions`)

    // Insert transactions
    let insertedCount = 0
    for (const tx of parsedTransactions) {
      await prisma.transaction.create({
        data: {
          strategyId: strategy.id,
          orderId: tx.id,
          type: tx.type,
          symbol: tx.symbol,
          volume: tx.volume,
          openPrice: tx.openPrice,
          closePrice: tx.closePrice,
          sl: tx.sl,
          tp: tx.tp,
          openTime: tx.openTime,
          closeTime: tx.closeTime,
          commission: tx.commission,
          swap: tx.swap,
          profit: tx.profit,
          balance: tx.balance,
          comment: tx.comment,
          isForwardTest: false,
        },
      })
      insertedCount++

      if (insertedCount % 100 === 0) {
        process.stdout.write(`  Progress: ${insertedCount}/${parsedTransactions.length}\r`)
      }
    }
    console.log(`✅ Inserted ${insertedCount} transactions                    `)

    // Get AFTER stats
    const after = await getHoldingTimeStats(strategy.id)
    console.log(`After: ${after.count} transactions, avg holding: ${after.avgHolding.toFixed(2)}h`)

    return {
      magicNumber,
      name: strategy.name,
      status: 'success',
      beforeCount: before.count,
      afterCount: after.count,
      beforeAvgHolding: before.avgHolding,
      afterAvgHolding: after.avgHolding,
    }
  } catch (error: any) {
    console.log(`❌ Migration failed: ${error.message}`)
    return {
      magicNumber,
      name: strategy.name,
      status: 'error',
      beforeCount: before.count,
      afterCount: 0,
      beforeAvgHolding: before.avgHolding,
      afterAvgHolding: 0,
      error: error.message,
    }
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('MASS DATABASE MIGRATION: All Strategies')
  console.log('='.repeat(80))
  console.log()

  // Get all strategies from database
  const strategies = await prisma.strategy.findMany({
    select: { magicNumber: true, name: true },
    orderBy: { magicNumber: 'asc' },
  })

  console.log(`Found ${strategies.length} strategies in database`)
  console.log()

  const results: MigrationResult[] = []

  // Migrate each strategy
  for (const strategy of strategies) {
    const result = await migrateStrategy(strategy.magicNumber)
    results.push(result)
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('MIGRATION SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const successCount = results.filter((r) => r.status === 'success').length
  const skippedCount = results.filter((r) => r.status === 'skipped').length
  const errorCount = results.filter((r) => r.status === 'error').length

  console.log(`Total Strategies: ${results.length}`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`⚠️  Skipped: ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log()

  // Detailed results table
  console.log('Detailed Results:')
  console.log()
  console.log('Magic#  | Status  | Before Txns | After Txns | Avg Holding (Before → After)')
  console.log('-'.repeat(80))

  for (const result of results) {
    const statusIcon =
      result.status === 'success' ? '✅' : result.status === 'skipped' ? '⚠️ ' : '❌'
    const holdingChange = `${result.beforeAvgHolding.toFixed(2)}h → ${result.afterAvgHolding.toFixed(2)}h`

    console.log(
      `${result.magicNumber.toString().padEnd(8)}| ${statusIcon} ${result.status.padEnd(7)}| ${result.beforeCount
        .toString()
        .padEnd(12)}| ${result.afterCount.toString().padEnd(11)}| ${holdingChange}`
    )
  }

  // Show errors if any
  if (errorCount > 0) {
    console.log()
    console.log('Errors:')
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`  Strategy #${r.magicNumber}: ${r.error}`)
      })
  }

  console.log()
  console.log('Migration complete!')

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
