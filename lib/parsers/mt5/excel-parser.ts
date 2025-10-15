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
   * Parse metadata from Excel data
   */
  private static parseMetadata(data: any[][]): MT5Metadata {
    // Look for metadata in the first rows
    let magicNumber = 0
    let currency = 'USD'
    let accountNumber: string | undefined
    let broker: string | undefined
    let leverage: number | undefined

    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i]
      const label = String(row[0] || '').toLowerCase()

      if (label.includes('expert') || label.includes('magic')) {
        const value = String(row[1] || '')
        const match = value.match(/\d+/)
        if (match) {
          magicNumber = parseInt(match[0], 10)
        }
      }

      if (label.includes('currency') || label.includes('deposit')) {
        const value = String(row[1] || '')
        if (value.length === 3) currency = value
      }

      if (label.includes('account')) {
        accountNumber = String(row[1] || '')
      }

      if (label.includes('broker') || label.includes('company')) {
        broker = String(row[1] || '')
      }

      if (label.includes('leverage')) {
        const value = String(row[1] || '')
        const match = value.match(/\d+/)
        if (match) {
          leverage = parseInt(match[0], 10)
        }
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
   * Parse summary statistics from Excel data
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

    // Parse summary data from rows
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const label = String(row[0] || '').toLowerCase().trim()
      const value = row[1]

      // Helper to parse numeric values
      const parseNum = (val: any): number => {
        if (typeof val === 'number') return val
        const str = String(val).replace(/[^\d.-]/g, '')
        return parseFloat(str) || 0
      }

      // Map labels to properties
      if (label.includes('symbol')) summary.symbol = String(value)
      if (label.includes('period')) summary.period = String(value)
      if (label.includes('total net profit')) summary.totalNetProfit = parseNum(value)
      if (label.includes('gross profit') && !label.includes('loss'))
        summary.totalGrossProfit = parseNum(value)
      if (label.includes('gross loss')) summary.totalGrossLoss = Math.abs(parseNum(value))
      if (label.includes('profit factor')) summary.profitFactor = parseNum(value)
      if (label.includes('expected payoff')) summary.expectedPayoff = parseNum(value)
      if (label.includes('absolute drawdown')) summary.absoluteDrawdown = parseNum(value)
      if (label.includes('maximal drawdown') && label.includes('%'))
        summary.maximalDrawdownPercent = parseNum(value)
      if (label.includes('maximal drawdown') && !label.includes('%'))
        summary.maximalDrawdown = parseNum(value)
      if (label.includes('relative drawdown') && label.includes('%'))
        summary.relativeDrawdownPercent = parseNum(value)
      if (label.includes('relative drawdown') && !label.includes('%'))
        summary.relativeDrawdown = parseNum(value)
      if (label.includes('total trades') || label.includes('total deals'))
        summary.totalTrades = parseNum(value)
      if (label.includes('short') && label.includes('won'))
        summary.shortPositions = parseNum(value)
      if (label.includes('long') && label.includes('won')) summary.longPositions = parseNum(value)
      if (label.includes('profit trades')) summary.profitTrades = parseNum(value)
      if (label.includes('loss trades')) summary.lossTrades = parseNum(value)
      if (label.includes('largest') && label.includes('profit'))
        summary.largestProfitTrade = parseNum(value)
      if (label.includes('largest') && label.includes('loss'))
        summary.largestLossTrade = parseNum(value)
      if (label.includes('average') && label.includes('profit') && !label.includes('loss'))
        summary.averageProfitTrade = parseNum(value)
      if (label.includes('average') && label.includes('loss'))
        summary.averageLossTrade = parseNum(value)
      if (label.includes('maximum consecutive wins'))
        summary.maxConsecutiveWins = parseNum(value)
      if (label.includes('maximum consecutive losses'))
        summary.maxConsecutiveLosses = parseNum(value)
      if (label.includes('maximal consecutive profit'))
        summary.maxConsecutiveProfit = parseNum(value)
      if (label.includes('maximal consecutive loss'))
        summary.maxConsecutiveLoss = parseNum(value)
    }

    // Calculate win rate if we have profit trades and total trades
    if (summary.totalTrades && summary.totalTrades > 0) {
      summary.winRate =
        ((summary.profitTrades || 0) / summary.totalTrades) * 100
    }

    // Calculate Sharpe ratio if we have enough data
    if (summary.totalNetProfit && summary.maximalDrawdown) {
      summary.sharpeRatio = summary.totalNetProfit / Math.abs(summary.maximalDrawdown)
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

    for (const [month, profit] of monthlyProfits.entries()) {
      const returnPct = (profit / 1000) * 100 // % return based on $1000 initial
      monthlyReturns.set(month, returnPct)
    }

    return { monthlyReturns, dailyEquity }
  }
}
