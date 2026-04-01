#!/usr/bin/env tsx
/**
 * FORWARD TEST DATA IMPORT SCRIPT
 *
 * Imports forward test transactions from CSV file to PostgreSQL database
 * Matches transactions to strategies by magic number
 * Filters out open positions (Close time: 1970/01/01)
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'
import { ForwardCSVParser } from '../lib/parsers/csv/forward-parser'

const prisma = new PrismaClient()

const FORWARD_CSV_PATH = 'data/forward/orders-deusfund-sqx1-13.csv'

async function main() {
  console.log('='.repeat(80))
  console.log('FORWARD TEST DATA IMPORT')
  console.log('='.repeat(80))
  console.log()

  // Check if CSV exists
  if (!existsSync(FORWARD_CSV_PATH)) {
    throw new Error(`Forward test CSV not found: ${FORWARD_CSV_PATH}`)
  }

  console.log(`Reading: ${FORWARD_CSV_PATH}`)

  // Read and parse CSV
  const csvContent = readFileSync(FORWARD_CSV_PATH, 'utf-8')
  const forwardData = ForwardCSVParser.parseCSVContent(csvContent)

  console.log(`\nParsed forward test data:`)
  console.log(`  Date range: ${forwardData.startDate.toISOString().split('T')[0]} → ${forwardData.endDate.toISOString().split('T')[0]}`)
  console.log(`  Strategies: ${forwardData.tradesByStrategy.size}`)
  console.log()

  let totalImported = 0
  let totalSkipped = 0
  let strategiesNotFound = 0

  // Process each strategy
  for (const [magicNumber, transactions] of forwardData.tradesByStrategy.entries()) {
    console.log(`\nProcessing Strategy #${magicNumber}:`)

    // Find strategy in database
    const strategy = await prisma.strategy.findUnique({
      where: { magicNumber },
    })

    if (!strategy) {
      console.log(`  ⚠️  Strategy not found in database - skipping`)
      strategiesNotFound++
      continue
    }

    console.log(`  Strategy: ${strategy.name}`)
    console.log(`  Forward transactions in CSV: ${transactions.length}`)

    // Filter out open positions (Close time: 1970-01-01 or invalid dates)
    const closedTransactions = transactions.filter(tx => {
      if (!tx.closeTime) return false
      const closeYear = tx.closeTime.getFullYear()
      // Filter out 1970 dates (open positions) and dates in far future
      return closeYear >= 2024 && closeYear <= 2030
    })

    console.log(`  Closed transactions: ${closedTransactions.length}`)
    console.log(`  Open/invalid positions filtered: ${transactions.length - closedTransactions.length}`)

    if (closedTransactions.length === 0) {
      console.log(`  ⚠️  No closed transactions to import`)
      totalSkipped += transactions.length
      continue
    }

    // Delete existing forward test transactions for this strategy
    const deleteResult = await prisma.transaction.deleteMany({
      where: {
        strategyId: strategy.id,
        isForwardTest: true,
      },
    })
    console.log(`  Deleted ${deleteResult.count} old forward test transactions`)

    // Insert new forward test transactions
    let insertedCount = 0
    for (const tx of closedTransactions) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          strategyId: strategy.id,
          orderId: tx.id,
          type: tx.type,
          symbol: tx.symbol,
          volume: tx.volume,
          openPrice: tx.openPrice,
          closePrice: tx.closePrice ?? tx.openPrice,
          sl: tx.sl,
          tp: tx.tp,
          openTime: tx.openTime,
          closeTime: tx.closeTime ?? tx.openTime,
          commission: tx.commission,
          swap: tx.swap,
          profit: tx.profit,
          balance: tx.balance ?? 0,
          comment: tx.comment,
          isForwardTest: true, // ← Mark as forward test!
        },
      })
      insertedCount++

      if (insertedCount % 100 === 0) {
        process.stdout.write(`    Progress: ${insertedCount}/${closedTransactions.length}\r`)
      }
    }

    console.log(`  ✅ Imported ${insertedCount} forward test transactions`)
    totalImported += insertedCount
    totalSkipped += (transactions.length - closedTransactions.length)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total strategies in CSV: ${forwardData.tradesByStrategy.size}`)
  console.log(`Strategies not found in DB: ${strategiesNotFound}`)
  console.log(`Total imported: ${totalImported}`)
  console.log(`Total skipped (open/invalid): ${totalSkipped}`)
  console.log()
  console.log('Import complete!')

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
