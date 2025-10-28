#!/usr/bin/env tsx
/**
 * Migration script: Import xlsx backtest files and CSV forward tests into PostgreSQL
 * 
 * Usage: npx tsx scripts/migrate-xlsx-to-db.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { MT5ExcelParser } from '../lib/parsers/mt5/excel-parser'
import { ForwardCSVParser } from '../lib/parsers/csv/forward-parser'
import {
  calculateStatistics,
  buildProfitCurve,
  calculateDrawdowns,
  normalizeProfitCurve,
} from '../lib/calculators/statistics'

const prisma = new PrismaClient()

/**
 * Load strategy names from names.json
 */
function loadStrategyNames(): Record<string, string> {
  try {
    const namesPath = join(process.cwd(), 'data', 'names.json')
    const namesContent = readFileSync(namesPath, 'utf-8')
    return JSON.parse(namesContent)
  } catch (error) {
    console.warn('⚠️  Failed to load strategy names from names.json:', error)
    return {}
  }
}

/**
 * Get strategy name by magic number
 */
function getStrategyName(
  magicNumber: number,
  strategyNames: Record<string, string>,
  customComment?: string
): string {
  const name = strategyNames[magicNumber.toString()]
  if (name) return name
  if (customComment) return customComment
  return `Strategy ${magicNumber}`
}

async function importBacktests() {
  console.log('📊 Starting backtest import...\n')

  const dataDir = join(process.cwd(), 'data', 'backtest')
  const allFiles = readdirSync(dataDir)
  const xlsxFiles = allFiles.filter(file => file.endsWith('.xlsx'))

  console.log(`Found ${xlsxFiles.length} backtest files\n`)

  const strategyNames = loadStrategyNames()
  let imported = 0
  let skipped = 0

  for (const filename of xlsxFiles) {
    try {
      const filePath = join(dataDir, filename)
      const buffer = readFileSync(filePath)
      const file = new File([buffer], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const result = await MT5ExcelParser.parseFile(file)

      if (!result.success) {
        console.error(`✗ Failed to parse ${filename}`)
        skipped++
        continue
      }

      const data = result.data
      const magicNumber = parseInt(filename.replace('.xlsx', ''))

      // Check if strategy already exists
      const existing = await prisma.strategy.findUnique({
        where: { magicNumber }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${filename} (already imported)`)
        skipped++
        continue
      }

      // Build profit curve and calculate stats
      const initialBalance = data.transactions[0]?.balance || 10000
      const stats = calculateStatistics(data.transactions, initialBalance)
      const profitCurve = buildProfitCurve(data.transactions)
      const drawdowns = calculateDrawdowns(profitCurve)

      // Create strategy
      const strategy = await prisma.strategy.create({
        data: {
          magicNumber,
          name: getStrategyName(magicNumber, strategyNames, data.metadata.customComment),
          symbol: data.summary.symbol,
          timeframe: data.summary.period,
          version: '1.0.0',
          backtestStart: data.transactions[0] ? data.transactions[0].openTime : new Date(),
          backtestEnd: data.transactions[data.transactions.length - 1] ? data.transactions[data.transactions.length - 1].openTime : new Date(),
          status: 'BACKTEST',
          isActive: true,

          // Store metrics as JSON
          backtestMetrics: JSON.stringify({
            ...stats,
            ...drawdowns
          }),

          // Store equity curve as JSON
          backtestEquity: JSON.stringify(profitCurve),

          transactions: {
            create: data.transactions.map(tx => ({
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
              isForwardTest: false
            }))
          }
        }
      })

      console.log(`✅ Imported ${filename} (${data.transactions.length} trades)`)
      imported++

    } catch (error) {
      console.error(`✗ Error importing ${filename}:`, error)
      skipped++
    }
  }

  console.log(`\n📊 Backtest import complete: ${imported} imported, ${skipped} skipped\n`)
}

async function importForwardTests() {
  console.log('📈 Starting forward test import...\n')

  const dataDir = join(process.cwd(), 'data', 'forward')
  const allFiles = readdirSync(dataDir)
  const csvFiles = allFiles.filter(file => file.endsWith('.csv'))

  if (csvFiles.length === 0) {
    console.log('⚠️  No forward test CSV files found\n')
    return
  }

  // Get the most recent CSV file
  const csvFilesWithStats = csvFiles.map(file => {
    const filePath = join(dataDir, file)
    const stats = require('fs').statSync(filePath)
    return { file, mtime: stats.mtime }
  })

  csvFilesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
  const mostRecentFile = csvFilesWithStats[0].file

  console.log(`Using most recent CSV: ${mostRecentFile}\n`)

  try {
    const filePath = join(dataDir, mostRecentFile)
    const csvContent = readFileSync(filePath, 'utf-8')
    const forwardData = ForwardCSVParser.parseCSVContent(csvContent)

    console.log(`Found ${forwardData.tradesByStrategy.size} strategies with forward tests`)

    let updated = 0
    let created = 0

    for (const [magicNumber, forwardTrades] of forwardData.tradesByStrategy.entries()) {
      const magicNum = typeof magicNumber === 'string' ? parseInt(magicNumber) : magicNumber
      
      // Find strategy
      const strategy = await prisma.strategy.findUnique({
        where: { magicNumber: magicNum }
      })

      if (!strategy) {
        console.log(`⚠️  Strategy ${magicNumber} not found in backtest data, skipping forward tests`)
        continue
      }

      // Build forward test profit curve
      const forwardStats = calculateStatistics(forwardTrades, 10000)
      const forwardCurve = buildProfitCurve(forwardTrades)
      const forwardDrawdowns = calculateDrawdowns(forwardCurve)

      // Update strategy with forward test data
      await prisma.strategy.update({
        where: { id: strategy.id },
        data: {
          forwardStart: forwardTrades.length > 0 ? forwardTrades[0].openTime : null,
          forwardEnd: forwardTrades.length > 0 ? forwardTrades[forwardTrades.length - 1].openTime : null,
          status: 'FORWARD_TEST',
          
          forwardMetrics: JSON.stringify({
            totalTrades: forwardStats.totalTrades,
            winRate: forwardStats.winRate,
            profitFactor: forwardStats.profitFactor,
            sharpeRatio: forwardStats.sharpeRatio,
            maxDrawdown: forwardStats.maxDrawdown,
            totalProfit: forwardStats.totalNetProfit,
            expectedPayoff: forwardStats.expectedPayoff,
            ...forwardDrawdowns
          }),
          
          forwardEquity: JSON.stringify(forwardCurve),
          
          transactions: {
            create: forwardTrades.map(tx => ({
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
              isForwardTest: true
            }))
          }
        }
      })

      console.log(`✅ Updated strategy ${magicNumber} with ${forwardTrades.length} forward trades`)
      updated++
    }

    console.log(`\n📈 Forward test import complete: ${updated} strategies updated\n`)

  } catch (error) {
    console.error('✗ Error importing forward tests:', error)
  }
}

async function main() {
  console.log('🚀 DEUS QUANT - Database Migration\n')
  console.log('Migrating xlsx backtest files and CSV forward tests to PostgreSQL...\n')

  try {
    // First import backtests
    await importBacktests()
    
    // Then import forward tests
    await importForwardTests()
    
    // Show summary
    const totalStrategies = await prisma.strategy.count()
    const totalTransactions = await prisma.transaction.count()
    
    console.log('✨ Migration complete!')
    console.log(`📊 Total strategies in database: ${totalStrategies}`)
    console.log(`💼 Total transactions in database: ${totalTransactions}\n`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
