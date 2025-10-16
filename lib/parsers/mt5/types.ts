// MT5 Parser Types and Interfaces

export interface MT5Metadata {
  magicNumber: number
  customComment?: string
  accountNumber?: string
  broker?: string
  currency: string
  leverage?: number
}

export interface MT5Summary {
  symbol: string
  period: string
  modelType: string
  parameters?: Record<string, any>

  // Performance metrics
  totalNetProfit: number
  totalGrossProfit: number
  totalGrossLoss: number
  profitFactor: number
  expectedPayoff: number

  // Drawdown metrics
  absoluteDrawdown: number
  maximalDrawdown: number
  maximalDrawdownPercent: number
  relativeDrawdown: number
  relativeDrawdownPercent: number

  // Trade statistics
  totalTrades: number
  shortPositions: number
  longPositions: number
  profitTrades: number
  lossTrades: number
  winRate: number

  // Risk metrics
  sharpeRatio?: number
  sortinoRatio?: number
  calmarRatio?: number
  recoveryFactor?: number

  // Series statistics
  largestProfitTrade: number
  largestLossTrade: number
  averageProfitTrade: number
  averageLossTrade: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  maxConsecutiveProfit: number
  maxConsecutiveLoss: number
  averageConsecutiveWins: number
  averageConsecutiveLosses: number
}

export interface MT5Transaction {
  id: number
  type: 'BUY' | 'SELL' | 'BALANCE' | 'CREDIT'
  openTime: Date
  closeTime?: Date
  symbol: string
  volume: number
  openPrice: number
  closePrice?: number
  sl?: number
  tp?: number
  commission: number
  swap: number
  profit: number
  balance?: number
  comment?: string
}

export interface MT5ParseResult {
  metadata: MT5Metadata
  summary: MT5Summary
  transactions: MT5Transaction[]
  monthlyReturns?: Map<string, number> // YYYY-MM -> return%
  dailyEquity?: Array<{ date: Date; equity: number }>
}

export interface ParseError {
  message: string
  field?: string
  value?: any
}

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ParseError }
