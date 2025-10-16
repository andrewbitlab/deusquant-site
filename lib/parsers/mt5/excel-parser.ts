import * as XLSX from 'xlsx'
import type {
  MT5ParseResult,
  MT5Metadata,
  MT5Summary,
  MT5Transaction,
  ParseResult,
  ParseError,
} from './types'

/**
 * MT5 Excel Parser
 * Parses MetaTrader 5 backtest results exported to Excel format
 */
export class MT5ExcelParser {
  /**
   * Parse an MT5 Excel file
   */
  static async parseFile(file: File): Promise<ParseResult<MT5ParseResult>> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      // Convert to JSON for easier processing
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

      // Parse different sections
      const metadata = this.parseMetadata(data)
      const summary = this.parseSummary(data)
      const transactions = this.parseTransactions(data)

      // Calculate additional metrics
      const { monthlyReturns, dailyEquity } = this.calculateDerivedMetrics(
        transactions,
        summary.totalNetProfit
      )

      return {
        success: true,
        data: {
          metadata,
          summary,
          transactions,
          monthlyReturns,
          dailyEquity,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown parsing error',
        },
      }
    }
  }

  /**
   * Parse metadata from Excel data (Polish MT5 format)
   */
  private static parseMetadata(data: any[][]): MT5Metadata {
    // Look for metadata in the first rows
    // Polish MT5 format has data in column 3 (index 3)
    let magicNumber = 0
    let customComment: string | undefined
    let currency = 'USD'
    let accountNumber: string | undefined
    let broker: string | undefined
    let leverage: number | undefined

    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i]
      const label = String(row[0] || '').toLowerCase()
      const value3 = String(row[3] || '')

      // CustomComment is in column 3
      if (value3.toLowerCase().includes('customcomment')) {
        const match = value3.match(/CustomComment[=\s]*(.+)/i)
        if (match) {
          customComment = match[1].trim()
        }
      }

      // MagicNumber is in column 3
      if (label.includes('parametry') || value3.toLowerCase().includes('magicnumber')) {
        const match = value3.match(/MagicNumber[=\s]*(\d+)/i)
        if (match) {
          magicNumber = parseInt(match[1], 10)
        }
      }

      // Broker name
      if (row[1] && String(row[1]).includes('Market')) {
        broker = String(row[1])
      }

      if (label.includes('currency') || label.includes('deposit')) {
        const value = String(row[1] || '')
        if (value.length === 3) currency = value
      }
    }

    return {
      magicNumber,
      customComment,
      currency,
      accountNumber,
      broker,
      leverage,
    }
  }

  /**
   * Parse summary statistics from Excel data (Polish MT5 format)
   */
  private static parseSummary(data: any[][]): MT5Summary {
    const summary: Partial<MT5Summary> = {
      symbol: '',
      period: '',
      modelType: 'Every tick',
      totalNetProfit: 0,
      totalGrossProfit: 0,
      totalGrossLoss: 0,
      profitFactor: 0,
      expectedPayoff: 0,
      absoluteDrawdown: 0,
      maximalDrawdown: 0,
      maximalDrawdownPercent: 0,
      relativeDrawdown: 0,
      relativeDrawdownPercent: 0,
      totalTrades: 0,
      shortPositions: 0,
      longPositions: 0,
      profitTrades: 0,
      lossTrades: 0,
      winRate: 0,
      largestProfitTrade: 0,
      largestLossTrade: 0,
      averageProfitTrade: 0,
      averageLossTrade: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      maxConsecutiveProfit: 0,
      maxConsecutiveLoss: 0,
      averageConsecutiveWins: 0,
      averageConsecutiveLosses: 0,
    }

    // Helper to parse numeric values
    const parseNum = (val: any): number => {
      if (typeof val === 'number') return val
      const str = String(val).replace(/[^\d.-]/g, '')
      return parseFloat(str) || 0
    }

    // Parse summary data from rows (Polish format: data in columns 3, 7, and 11)
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const label0 = String(row[0] || '').toLowerCase().trim()
      const label4 = String(row[4] || '').toLowerCase().trim()
      const label8 = String(row[8] || '').toLowerCase().trim()
      const value3 = row[3] // Column 3 for first value
      const value7 = row[7] // Column 7 for left side values
      const value11 = row[11] // Column 11 for right side values

      // Instrument/Symbol (in column 0 labels)
      if (label0.includes('instrument')) {
        summary.symbol = String(value3).replace('_bt', '')
      }

      // Period
      if (label0.includes('okres') || label0.includes('period')) {
        const periodStr = String(value3)
        if (periodStr.includes('H1')) summary.period = 'H1'
      }

      // Main metrics (column 0 labels, column 3 values)
      if (label0.includes('zysk netto')) {
        summary.totalNetProfit = parseNum(value3)
        // Drawdown might be in the same row (columns 8+11)
        if (label8.includes('względne obsunięcia') && label8.includes('equity') && value11) {
          const ddStr = String(value11)
          // Try to parse just the number (might not have % format here)
          const ddValue = parseNum(ddStr)
          if (ddValue > 0) {
            summary.maximalDrawdown = ddValue
            summary.relativeDrawdown = ddValue
            // Try to get percentage from col7 if available
            const ddPctStr = String(value7)
            const pctMatch = ddPctStr.match(/([\d.]+)/)
            if (pctMatch) {
              summary.maximalDrawdownPercent = parseFloat(pctMatch[1])
              summary.relativeDrawdownPercent = parseFloat(pctMatch[1])
            }
          }
        }
      }
      if (label0.includes('zysk brutto') && !label0.includes('strata')) {
        summary.totalGrossProfit = parseNum(value3)
        // Drawdown might be in columns 8+11 here too
        if (label8.includes('względne obsunięcia') && label8.includes('equity') && value11) {
          const ddStr = String(value11)
          const match = ddStr.match(/([\d.]+)%?\s*\(([\d.]+)\)/)
          if (match) {
            summary.relativeDrawdownPercent = parseFloat(match[1])
            summary.relativeDrawdown = parseFloat(match[2])
            summary.maximalDrawdownPercent = summary.relativeDrawdownPercent
            summary.maximalDrawdown = summary.relativeDrawdown
          } else {
            // Try simple number parse
            const ddValue = parseNum(ddStr)
            if (ddValue > 0 && ddValue < 100) {
              // Looks like percentage
              summary.maximalDrawdownPercent = ddValue
              summary.relativeDrawdownPercent = ddValue
            } else if (ddValue >= 100) {
              // Looks like absolute value
              summary.maximalDrawdown = ddValue
              summary.relativeDrawdown = ddValue
            }
          }
        }
      }
      if (label0.includes('strata brutto'))
        summary.totalGrossLoss = Math.abs(parseNum(value3))
      if (label0.includes('wskaźnik zysku'))
        summary.profitFactor = parseNum(value3)
      if (label0.includes('oczekiwany payoff'))
        summary.expectedPayoff = parseNum(value3)
      if (label0.includes('wszystkie transakcje'))
        summary.totalTrades = parseNum(value3)

      // Sharpe Ratio (in column 4, value in column 7)
      if (label4.includes('sharpe'))
        summary.sharpeRatio = parseNum(value7)

      // Drawdown - use Equity drawdown from column 8+11
      if (label8.includes('względne obsunięcia') && label8.includes('equity') && value11) {
        const ddStr = String(value11)
        const match = ddStr.match(/([\d.]+)%\s*\(([\d.]+)\)/)
        if (match) {
          summary.relativeDrawdownPercent = parseFloat(match[1])
          summary.relativeDrawdown = parseFloat(match[2])
          summary.maximalDrawdownPercent = summary.relativeDrawdownPercent
          summary.maximalDrawdown = summary.relativeDrawdown
        }
      }

      // Profit/Loss trades (column 4/8, values in column 7/11)
      if (label4.includes('profit trades')) {
        const profitStr = String(value7)
        const match = profitStr.match(/(\d+)\s*\(([\d.]+)%\)/)
        if (match) {
          summary.profitTrades = parseInt(match[1], 10)
        } else {
          summary.profitTrades = parseNum(value7)
        }
      }
      if (label8.includes('loss trades')) {
        const lossStr = String(value11)
        const match = lossStr.match(/(\d+)\s*\(([\d.]+)%\)/)
        if (match) {
          summary.lossTrades = parseInt(match[1], 10)
        } else {
          summary.lossTrades = parseNum(value11)
        }
      }

      // Largest trades (column 4/8, values in column 7/11)
      if (label4.includes('największy zyskowna'))
        summary.largestProfitTrade = parseNum(value7)
      if (label8.includes('największy stratna'))
        summary.largestLossTrade = Math.abs(parseNum(value11))

      // Average trades
      if (label4.includes('średnia zyskowna'))
        summary.averageProfitTrade = parseNum(value7)
      if (label8.includes('średnia stratna'))
        summary.averageLossTrade = Math.abs(parseNum(value11))

      // Consecutive wins/losses
      if (label4.includes('maksimum kolejne wygrane')) {
        const winsStr = String(value7)
        const match = winsStr.match(/(\d+)/)
        if (match) summary.maxConsecutiveWins = parseInt(match[1], 10)
      }
      if (label8.includes('maksimum kolejne straty')) {
        const lossesStr = String(value11)
        const match = lossesStr.match(/(\d+)/)
        if (match) summary.maxConsecutiveLosses = parseInt(match[1], 10)
      }
    }

    // Calculate win rate if we have profit trades and total trades
    if (summary.totalTrades && summary.totalTrades > 0) {
      summary.winRate =
        ((summary.profitTrades || 0) / summary.totalTrades) * 100
    }

    return summary as MT5Summary
  }

  /**
   * Parse transaction history from Excel data (Polish MT5 "Transakcje" table)
   */
  private static parseTransactions(data: any[][]): MT5Transaction[] {
    const transactions: MT5Transaction[] = []

    // Find the "Transakcje" (deals) table - not "Zlecenia" (orders)
    let headerRow = -1
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const firstCell = String(row[0] || '').toLowerCase()

      // Look for "Transakcje" section header first
      if (firstCell.includes('transakcje') && !firstCell.includes('wszystkie')) {
        // Next row should be the header with "Czas", "Umowa", etc.
        if (i + 1 < data.length) {
          const nextRow = String(data[i + 1][0] || '').toLowerCase()
          if (nextRow.includes('czas') || nextRow.includes('time')) {
            headerRow = i + 1
            break
          }
        }
      }
    }

    if (headerRow === -1) return transactions

    // Parse transactions (Polish format from "Transakcje" table)
    // Columns: Czas(0), Umowa(1), Instrument(2), Typ(3), Kierunek(4), Wolumen(5),
    //          Cena(6), Zlecenie(7), Prowizja(8), Swap(9), Zysk(10), Saldo(11), Komentarz(12)
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 5) continue

      // Stop if we hit another section or empty rows
      if (!row[0] && !row[1]) continue

      try {
        const dealTime = this.parseDate(row[0])
        const type = this.parseTradeType(String(row[3] || ''))
        const symbol = String(row[2] || '')
        const volume = parseFloat(String(row[5] || '0'))
        const price = parseFloat(String(row[6] || '0'))
        const commission = parseFloat(String(row[8] || '0'))
        const swap = parseFloat(String(row[9] || '0'))
        const profit = parseFloat(String(row[10] || '0'))
        const balance = parseFloat(String(row[11] || '0'))

        // Skip if date is invalid
        if (!dealTime || dealTime.getTime() === 0) continue

        const transaction: MT5Transaction = {
          id: parseInt(String(row[1] || i), 10),
          type: type,
          openTime: dealTime,
          closeTime: dealTime, // In deals table, we only have one timestamp
          symbol: symbol,
          volume: volume,
          openPrice: price,
          closePrice: price,
          commission: commission,
          swap: swap,
          profit: profit,
          balance: balance,
          comment: String(row[12] || '') || undefined,
        }

        transactions.push(transaction)
      } catch (error) {
        // Skip malformed rows
        continue
      }
    }

    return transactions
  }

  /**
   * Parse trade type from string
   */
  private static parseTradeType(type: string): 'BUY' | 'SELL' | 'BALANCE' | 'CREDIT' {
    const normalized = type.toLowerCase()
    if (normalized.includes('buy')) return 'BUY'
    if (normalized.includes('sell')) return 'SELL'
    if (normalized.includes('balance')) return 'BALANCE'
    if (normalized.includes('credit')) return 'CREDIT'
    return 'BUY' // default
  }

  /**
   * Parse date from Excel serial number or string
   */
  private static parseDate(value: any): Date {
    if (value instanceof Date) return value
    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000)
    }
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return date
    }
    return new Date(0)
  }

  /**
   * Calculate derived metrics (monthly returns, daily equity)
   */
  private static calculateDerivedMetrics(
    transactions: MT5Transaction[],
    totalProfit: number
  ): {
    monthlyReturns: Map<string, number>
    dailyEquity: Array<{ date: Date; equity: number }>
  } {
    const monthlyReturns = new Map<string, number>()
    const dailyEquity: Array<{ date: Date; equity: number }> = []

    if (transactions.length === 0) {
      return { monthlyReturns, dailyEquity }
    }

    // Find initial balance (first transaction should be balance deposit)
    const initialBalance = transactions[0].balance || 10000

    // Calculate equity curve directly from balance
    // Balance is already cumulative in MT5 reports
    for (const tx of transactions) {
      if (tx.balance && tx.balance > 0) {
        dailyEquity.push({
          date: tx.closeTime || tx.openTime,
          equity: tx.balance,
        })
      }
    }

    // Calculate monthly returns
    const monthlyProfits = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.profit !== 0) {
        const monthKey = `${tx.openTime.getFullYear()}-${String(
          tx.openTime.getMonth() + 1
        ).padStart(2, '0')}`
        monthlyProfits.set(monthKey, (monthlyProfits.get(monthKey) || 0) + tx.profit)
      }
    }

    Array.from(monthlyProfits.entries()).forEach(([month, profit]) => {
      const returnPct = (profit / initialBalance) * 100 // % return based on initial balance
      monthlyReturns.set(month, returnPct)
    })

    return { monthlyReturns, dailyEquity }
  }
}
