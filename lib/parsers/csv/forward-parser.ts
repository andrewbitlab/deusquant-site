import type { MT5Transaction } from '../mt5/types'

export interface ForwardTestData {
  tradesByStrategy: Map<number, MT5Transaction[]>
  startDate: Date
  endDate: Date
}

/**
 * CSV Forward Test Parser (Server-side)
 * Parses forward test results from CSV format (MT5 export)
 */
export class ForwardCSVParser {
  /**
   * Parse CSV content (string) from server-side
   */
  static parseCSVContent(csvContent: string): ForwardTestData {
    const tradesByStrategy = new Map<number, MT5Transaction[]>()
    let minDate: Date | null = null
    let maxDate: Date | null = null

    // Split into lines
    const lines = csvContent.split('\n').map(line => line.trim())

    // Find header line (skip sep= line if exists)
    let headerIndex = 0
    if (lines[0]?.startsWith('sep=')) {
      headerIndex = 1
    }

    const headers = lines[headerIndex].split(',')

    // Create header index map
    const getColumnIndex = (name: string) => {
      return headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
    }

    const ticketIdx = getColumnIndex('ticket')
    const magicIdx = getColumnIndex('magic')
    const openDateIdx = getColumnIndex('open date')
    const openTimeIdx = getColumnIndex('open time')
    const closeDateIdx = getColumnIndex('close date')
    const closeTimeIdx = getColumnIndex('close time')
    const buyOrSellIdx = getColumnIndex('buy/sell')
    const symbolIdx = getColumnIndex('symbol')
    const lotsIdx = getColumnIndex('lots')
    const openPriceIdx = getColumnIndex('open price')
    const closePriceIdx = getColumnIndex('close price')
    const netProfitIdx = getColumnIndex('net profit')
    const swapIdx = getColumnIndex('swap')
    const commissionIdx = getColumnIndex('commission')
    const commentIdx = getColumnIndex('comment')

    // Parse data rows
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line || line.length === 0) continue

      const columns = line.split(',')
      if (columns.length < 10) continue

      try {
        // Parse magic number
        const magicNumber = parseInt(columns[magicIdx]?.trim() || '0')
        if (!magicNumber || magicNumber === 0) continue

        // Parse open date/time
        const openDateStr = columns[openDateIdx]?.trim() || ''
        const openTimeStr = columns[openTimeIdx]?.trim() || '00:00:00'

        let openDate: Date
        try {
          const [year, month, day] = openDateStr.split('/')
          openDate = new Date(`${year}-${month}-${day}T${openTimeStr}`)

          if (isNaN(openDate.getTime())) {
            openDate = new Date(openDateStr.replace(/\//g, '-'))
          }

          if (isNaN(openDate.getTime())) continue
        } catch {
          continue
        }

        // Parse close date/time
        const closeDateStr = columns[closeDateIdx]?.trim() || ''
        const closeTimeStr = columns[closeTimeIdx]?.trim() || '00:00:00'

        let closeDate: Date | undefined
        try {
          const [year, month, day] = closeDateStr.split('/')
          closeDate = new Date(`${year}-${month}-${day}T${closeTimeStr}`)

          if (isNaN(closeDate.getTime())) {
            closeDate = new Date(closeDateStr.replace(/\//g, '-'))
          }

          // Check if this is an open position (1970/01/01)
          if (closeDate.getFullYear() === 1970) {
            closeDate = undefined
          }
        } catch {
          closeDate = undefined
        }

        // Track date range (use open date for range)
        if (!minDate || openDate < minDate) minDate = openDate
        if (!maxDate || openDate > maxDate) maxDate = openDate

        // Parse trade type
        const buyOrSell = columns[buyOrSellIdx]?.toLowerCase() || ''
        const tradeType = buyOrSell.includes('buy') ? 'BUY' : 'SELL'

        // Parse numeric values
        const parseNumber = (value: string | undefined) => {
          return parseFloat((value || '0').replace(/,/g, ''))
        }

        // Create MT5Transaction
        const transaction: MT5Transaction = {
          id: parseInt(columns[ticketIdx]?.trim() || '0'),
          type: tradeType,
          openTime: openDate,
          closeTime: closeDate, // Can be undefined for open positions
          symbol: columns[symbolIdx]?.trim() || '',
          volume: parseNumber(columns[lotsIdx]),
          openPrice: parseNumber(columns[openPriceIdx]),
          closePrice: parseNumber(columns[closePriceIdx]),
          commission: parseNumber(columns[commissionIdx]),
          swap: parseNumber(columns[swapIdx]),
          profit: parseNumber(columns[netProfitIdx]),
          balance: 0, // Will be calculated cumulatively
          comment: `Forward Test - ${columns[commentIdx]?.trim() || ''}`,
        }

        // Add to strategy's transaction list
        if (!tradesByStrategy.has(magicNumber)) {
          tradesByStrategy.set(magicNumber, [])
        }
        tradesByStrategy.get(magicNumber)!.push(transaction)
      } catch (error) {
        console.warn(`Failed to parse line ${i}:`, error)
        continue
      }
    }

    // Sort each strategy's transactions by date
    Array.from(tradesByStrategy.entries()).forEach(([magicNumber, transactions]) => {
      transactions.sort((a, b) => a.openTime.getTime() - b.openTime.getTime())
    })

    return {
      tradesByStrategy,
      startDate: minDate || new Date(),
      endDate: maxDate || new Date(),
    }
  }

  /**
   * Legacy browser-based parseFile (for upload page)
   */
  static async parseFile(file: File): Promise<ForwardTestData> {
    const text = await file.text()
    return this.parseCSVContent(text)
  }
}
