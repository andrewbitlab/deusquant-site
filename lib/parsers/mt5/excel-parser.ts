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
    let currency = 'USD'
    let accountNumber: string | undefined
    let broker: string | undefined
    let leverage: number | undefined

    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i]
      const label = String(row[0] || '').toLowerCase()
      const value3 = String(row[3] || '')

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

    // Parse summary data from rows (Polish format: data in column 3)
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const label = String(row[0] || '').toLowerCase().trim()
      const value3 = row[3] // Column 3 for first value
      const value7 = row[7] // Column 7 for second value

      // Instrument/Symbol
      if (label.includes('instrument')) {
        summary.symbol = String(value3).replace('_bt', '')
      }

      // Period
      if (label.includes('okres') || label.includes('period')) {
        const periodStr = String(value3)
        if (periodStr.includes('H1')) summary.period = 'H1'
      }

      // Polish labels mapping
      if (label.includes('zysk netto')) summary.totalNetProfit = parseNum(value3)
      if (label.includes('zysk brutto') && !label.includes('strata'))
        summary.totalGrossProfit = parseNum(value3)
      if (label.includes('strata brutto'))
        summary.totalGrossLoss = Math.abs(parseNum(value3))
      if (label.includes('wskaźnik zysku'))
        summary.profitFactor = parseNum(value3)
      if (label.includes('oczekiwany payoff'))
        summary.expectedPayoff = parseNum(value3)
      if (label.includes('sharpe'))
        summary.sharpeRatio = parseNum(value7)

      // Drawdown
      if (label.includes('względne obsunięcia') && value7) {
        const ddStr = String(value7)
        const match = ddStr.match(/([\d.]+)\s*\(([\d.]+)%\)/)
        if (match) {
          summary.relativeDrawdown = parseFloat(match[1])
          summary.relativeDrawdownPercent = parseFloat(match[2])
          // Use relative as maximal for now
          summary.maximalDrawdown = summary.relativeDrawdown
          summary.maximalDrawdownPercent = summary.relativeDrawdownPercent
        }
      }

      // Trade statistics
      if (label.includes('wszystkie transakcje'))
        summary.totalTrades = parseNum(value3)
      if (label.includes('profit trades'))
        summary.profitTrades = parseNum(value7)
      if (label.includes('loss trades'))
        summary.lossTrades = parseNum(value7)
      if (label.includes('największy zyskowna'))
        summary.largestProfitTrade = parseNum(value7)
      if (label.includes('największy stratna'))
        summary.largestLossTrade = Math.abs(parseNum(value7))
      if (label.includes('średnia zyskowna'))
        summary.averageProfitTrade = parseNum(value7)
      if (label.includes('średnia stratna'))
        summary.averageLossTrade = Math.abs(parseNum(value7))
      if (label.includes('maksimum kolejne wygrane'))
        summary.maxConsecutiveWins = parseNum(value7)
      if (label.includes('maksimum kolejne straty'))
        summary.maxConsecutiveLosses = parseNum(value7)
    }

    // Calculate win rate if we have profit trades and total trades
    if (summary.totalTrades && summary.totalTrades > 0) {
      summary.winRate =
        ((summary.profitTrades || 0) / summary.totalTrades) * 100
    }

    return summary as MT5Summary
  }

  /**
   * Parse transaction history from Excel data
   */
  private static parseTransactions(data: any[][]): MT5Transaction[] {
    const transactions: MT5Transaction[] = []

    // Find the transactions table header
    let headerRow = -1
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const firstCell = String(row[0] || '').toLowerCase()
      if (
        firstCell.includes('time') ||
        firstCell.includes('#') ||
        firstCell === 'ticket'
      ) {
        headerRow = i
        break
      }
    }

    if (headerRow === -1) return transactions

    // Parse transactions
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 5) continue

      try {
        const transaction: MT5Transaction = {
          id: parseInt(String(row[0] || i), 10),
          type: this.parseTradeType(String(row[2] || '')),
          openTime: this.parseDate(row[1]),
          symbol: String(row[3] || ''),
          volume: parseFloat(String(row[4] || '0')),
          openPrice: parseFloat(String(row[5] || '0')),
          closePrice: parseFloat(String(row[7] || '0')) || undefined,
          sl: parseFloat(String(row[6] || '0')) || undefined,
          tp: parseFloat(String(row[8] || '0')) || undefined,
          closeTime: this.parseDate(row[9]),
          commission: parseFloat(String(row[10] || '0')),
          swap: parseFloat(String(row[11] || '0')),
          profit: parseFloat(String(row[12] || '0')),
          balance: parseFloat(String(row[13] || '0')) || undefined,
          comment: String(row[14] || '') || undefined,
        }

        if (transaction.openTime && transaction.openTime.getTime() > 0) {
          transactions.push(transaction)
        }
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

    // Calculate daily equity curve
    let runningBalance = 1000 // Normalize to $1000 initial
    dailyEquity.push({
      date: transactions[0].openTime,
      equity: runningBalance,
    })

    for (const tx of transactions) {
      runningBalance += tx.profit
      dailyEquity.push({
        date: tx.closeTime || tx.openTime,
        equity: runningBalance,
      })
    }

    // Calculate monthly returns
    const monthlyProfits = new Map<string, number>()
    for (const tx of transactions) {
      const monthKey = `${tx.openTime.getFullYear()}-${String(
        tx.openTime.getMonth() + 1
      ).padStart(2, '0')}`
      monthlyProfits.set(monthKey, (monthlyProfits.get(monthKey) || 0) + tx.profit)
    }

    Array.from(monthlyProfits.entries()).forEach(([month, profit]) => {
      const returnPct = (profit / 1000) * 100 // % return based on $1000 initial
      monthlyReturns.set(month, returnPct)
    })

    return { monthlyReturns, dailyEquity }
  }
}
