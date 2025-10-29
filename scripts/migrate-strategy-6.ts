#!/usr/bin/env tsx
/**
 * DATABASE MIGRATION SCRIPT
 *
 * Migrates Strategy #6 to use enhanced Excel parser with accurate holding times.
 *
 * Process:
 * 1. Backup current transaction count
 * 2. Delete all existing transactions for Strategy #6
 * 3. Re-import using enhanced parser with deal-pairing logic
 * 4. Verify holding times are accurate
 * 5. Display before/after comparison
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { MT5ExcelParser } from '../lib/parsers/mt5/excel-parser'

const prisma = new PrismaClient()

interface MigrationStats {
  before: {
    transactionCount: number
    avgHoldingTime: number
    zeroHoldingTimeCount: number
  }
  after: {
    transactionCount: number
    avgHoldingTime: number
    zeroHoldingTimeCount: number
  }
}

async function calculateHoldingTimeStats(strategyId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { strategyId },
    select: {
      openTime: true,
      closeTime: true,
    },
  })

  let totalHoldingHours = 0
  let zeroCount = 0
  let validCount = 0

  for (const tx of transactions) {
    if (tx.openTime && tx.closeTime) {
      const holdingMs = tx.closeTime.getTime() - tx.openTime.getTime()
      const holdingHours = holdingMs / (1000 * 60 * 60)

      if (holdingHours === 0) {
        zeroCount++
      } else {
        totalHoldingHours += holdingHours
        validCount++
      }
    }
  }

  const avgHoldingTime = validCount > 0 ? totalHoldingHours / validCount : 0

  return {
    transactionCount: transactions.length,
    avgHoldingTime,
    zeroHoldingTimeCount: zeroCount,
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('DATABASE MIGRATION: Strategy #6 - Enhanced Parser')
  console.log('='.repeat(80))
  console.log()

  // Step 1: Find Strategy #6
  console.log('Step 1: Locating Strategy #6...')
  const strategy = await prisma.strategy.findUnique({
    where: { magicNumber: 6 },
  })

  if (!strategy) {
    console.error('❌ Strategy #6 not found in database!')
    process.exit(1)
  }

  console.log(`✅ Found: ${strategy.name}`)
  console.log(`   ID: ${strategy.id}`)
  console.log()

  // Step 2: Calculate BEFORE stats
  console.log('Step 2: Calculating current statistics...')
  const beforeStats = await calculateHoldingTimeStats(strategy.id)

  console.log(`   Transactions: ${beforeStats.transactionCount}`)
  console.log(`   Average Holding Time: ${beforeStats.avgHoldingTime.toFixed(2)} hours`)
  console.log(`   Zero Holding Time Count: ${beforeStats.zeroHoldingTimeCount}`)
  console.log()

  // Step 3: Delete existing transactions
  console.log('Step 3: Deleting existing transactions...')
  const deleteResult = await prisma.transaction.deleteMany({
    where: { strategyId: strategy.id },
  })

  console.log(`✅ Deleted ${deleteResult.count} transactions`)
  console.log()

  // Step 4: Re-import using enhanced parser
  console.log('Step 4: Re-importing with enhanced parser...')

  try {
    const buffer = readFileSync('data/backtest/6.xlsx')
    const file = new File([buffer], '6.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const parseResult = await MT5ExcelParser.parseFile(file)

    if (!parseResult.success) {
      console.error('❌ Parser failed:', parseResult.error)
      process.exit(1)
    }

    const { transactions: parsedTransactions } = parseResult.data

    console.log(`   Parsed ${parsedTransactions.length} positions from Excel`)

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

      if (insertedCount % 50 === 0) {
        process.stdout.write(`   Progress: ${insertedCount}/${parsedTransactions.length}\r`)
      }
    }

    console.log(`✅ Inserted ${insertedCount} transactions                    `)
    console.log()

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }

  // Step 5: Calculate AFTER stats
  console.log('Step 5: Calculating new statistics...')
  const afterStats = await calculateHoldingTimeStats(strategy.id)

  console.log(`   Transactions: ${afterStats.transactionCount}`)
  console.log(`   Average Holding Time: ${afterStats.avgHoldingTime.toFixed(2)} hours`)
  console.log(`   Zero Holding Time Count: ${afterStats.zeroHoldingTimeCount}`)
  console.log()

  // Step 6: Display comparison
  console.log('='.repeat(80))
  console.log('MIGRATION RESULTS - BEFORE vs AFTER')
  console.log('='.repeat(80))
  console.log()

  console.log('Transaction Count:')
  console.log(`  Before: ${beforeStats.transactionCount}`)
  console.log(`  After:  ${afterStats.transactionCount}`)
  console.log(`  Change: ${afterStats.transactionCount - beforeStats.transactionCount}`)
  console.log()

  console.log('Average Holding Time:')
  console.log(`  Before: ${beforeStats.avgHoldingTime.toFixed(2)} hours`)
  console.log(`  After:  ${afterStats.avgHoldingTime.toFixed(2)} hours`)
  console.log(`  Change: ${(afterStats.avgHoldingTime - beforeStats.avgHoldingTime).toFixed(2)} hours`)
  console.log()

  console.log('Transactions with Zero Holding Time:')
  console.log(`  Before: ${beforeStats.zeroHoldingTimeCount} (${((beforeStats.zeroHoldingTimeCount / beforeStats.transactionCount) * 100).toFixed(1)}%)`)
  console.log(`  After:  ${afterStats.zeroHoldingTimeCount} (${afterStats.transactionCount > 0 ? ((afterStats.zeroHoldingTimeCount / afterStats.transactionCount) * 100).toFixed(1) : 0}%)`)
  console.log()

  // Validation
  if (afterStats.zeroHoldingTimeCount === 0 && afterStats.avgHoldingTime > 0) {
    console.log('✅ MIGRATION SUCCESSFUL!')
    console.log('   All transactions now have accurate holding times.')
    console.log()
    console.log('Next step: Verify the Holding Time Analysis chart at:')
    console.log('   http://localhost:3000/strategy/6')
  } else {
    console.log('⚠️  WARNING: Migration completed but some issues detected:')
    if (afterStats.zeroHoldingTimeCount > 0) {
      console.log(`   - ${afterStats.zeroHoldingTimeCount} transactions still have zero holding time`)
    }
    if (afterStats.avgHoldingTime === 0) {
      console.log('   - Average holding time is still 0 hours')
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
