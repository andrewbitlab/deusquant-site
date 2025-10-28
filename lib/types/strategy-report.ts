/**
 * Strategy Report Data Types
 * Comprehensive interfaces for MT5 strategy tester reports
 * All metrics match 1:1 with MetaTrader 5 HTML reports
 */

// ============================================================================
// MAIN REPORT INTERFACE
// ============================================================================

export interface StrategyReportData {
  // Strategy identification
  strategyInfo: StrategyInfo

  // Settings from EA
  settings: StrategySettings

  // All performance metrics (50+ metrics)
  metrics: PerformanceMetrics

  // Chart data points
  charts: ChartData

  // Trade summary statistics
  tradesSummary: TradesSummary
}

// ============================================================================
// STRATEGY INFO
// ============================================================================

export interface StrategyInfo {
  magicNumber: string
  name: string
  expertName: string
  symbol: string
  timeframe: string
  periodStart: Date
  periodEnd: Date
  broker: string
  build: string
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface StrategySettings {
  // General settings
  company: string
  currency: string
  initialDeposit: number
  leverage: string

  // Expert Advisor input parameters (flexible structure)
  inputs: Record<string, string | number | boolean>
}

// ============================================================================
// PERFORMANCE METRICS (50+ metrics from MT5 report)
// ============================================================================

export interface PerformanceMetrics {
  // === HISTORY QUALITY ===
  historyQuality: number // percentage (0-100)
  bars: number
  tickChart: number
  symbols: number

  // === PROFIT METRICS ===
  totalNetProfit: number // dollars
  grossProfit: number // dollars
  grossLoss: number // dollars (negative value)

  // === DRAWDOWN METRICS ===
  // Balance Drawdown
  balanceDrawdownAbsolute: number // dollars
  balanceDrawdownRelativeDollars: number // dollars
  balanceDrawdownRelativePercent: number // percentage
  balanceDrawdownMaxPercent: number // percentage
  balanceDrawdownMaxDollars: number // dollars

  // Equity Drawdown
  equityDrawdownAbsolute: number // dollars
  equityDrawdownRelativeDollars: number // dollars
  equityDrawdownRelativePercent: number // percentage
  equityDrawdownMaxPercent: number // percentage
  equityDrawdownMaxDollars: number // dollars

  // === PERFORMANCE RATIOS ===
  profitFactor: number // ratio
  expectedPayoff: number // dollars
  marginLevel: number // percentage
  recoveryFactor: number // ratio
  sharpeRatio: number // ratio
  zScore: number // value
  zScorePercent: number // percentage
  ahpr: number // ratio
  ahprPercent: number // percentage
  ghpr: number // ratio
  ghprPercent: number // percentage
  lrCorrelation: number // correlation coefficient
  lrStandardError: number // value
  onTesterResult: number // custom metric value

  // === TRADE STATISTICS ===
  totalTrades: number
  totalDeals: number

  // Short trades
  shortTrades: number
  shortTradesWinPercent: number

  // Long trades
  longTrades: number
  longTradesWinPercent: number

  // Profit/Loss trades
  profitTrades: number
  profitTradesPercent: number
  lossTrades: number
  lossTradesPercent: number

  // === WIN/LOSS ANALYSIS ===
  largestProfitTrade: number // dollars
  largestLossTrade: number // dollars (negative)
  averageProfitTrade: number // dollars
  averageLossTrade: number // dollars (negative)

  // Consecutive wins/losses
  maxConsecutiveWins: number // count
  maxConsecutiveWinsDollars: number // dollars
  maxConsecutiveLosses: number // count
  maxConsecutiveLossesDollars: number // dollars (negative)

  // Maximum profit/loss runs
  maxProfitDollars: number // dollars
  maxProfitCount: number // count of trades
  maxLossDollars: number // dollars (negative)
  maxLossCount: number // count of trades

  // Average consecutive
  averageConsecutiveWins: number
  averageConsecutiveLosses: number

  // === CORRELATION METRICS (MAE/MFE) ===
  correlationProfitMFE: number // correlation coefficient
  correlationProfitMAE: number // correlation coefficient
  correlationMFEMAE: number // correlation coefficient

  // === TIME-BASED METRICS ===
  minHoldingTime: string // HH:MM:SS format
  maxHoldingTime: string // HH:MM:SS format
  avgHoldingTime: string // HH:MM:SS format
}

// ============================================================================
// CHART DATA
// ============================================================================

export interface ChartData {
  // Equity curve (balance and equity over time)
  equityCurve: EquityCurvePoint[]

  // Drawdown over time
  drawdown: DrawdownPoint[]

  // MAE/MFE scatter plot data
  maemfe: MAEMFEPoint[]

  // Profit distribution histogram
  profitDistribution: DistributionBin[]

  // Holding time distribution
  holdingTime: HoldingTimeBin[]

  // Time-based distributions
  hourlyDistribution: TimeDistribution[]
  dailyDistribution: TimeDistribution[]
  monthlyDistribution: TimeDistribution[]

  // Holding time scatter (profit vs duration)
  holdingTimeScatter: HoldingTimePoint[]
}

export interface EquityCurvePoint {
  date: string // ISO date string
  balance: number
  equity: number
}

export interface DrawdownPoint {
  date: string // ISO date string
  drawdown: number // negative value
  drawdownPercent: number
}

export interface MAEMFEPoint {
  tradeId: number
  profit: number
  mae: number // Maximum Adverse Excursion
  mfe: number // Maximum Favorable Excursion
  volume: number
  openTime: string
  closeTime: string
}

export interface DistributionBin {
  rangeStart: number
  rangeEnd: number
  count: number
  label: string // e.g., "-500 to -400"
}

export interface HoldingTimeBin {
  label: string // e.g., "< 1h", "1-4h", "4-24h", "1-7d", "> 7d"
  durationMinutes: number // center of bin
  count: number
}

export interface TimeDistribution {
  label: string // e.g., "00", "Mon", "Jan"
  value: number // hour (0-23), day (0-6), or month (0-11)
  entryCount: number // number of entries in this time period
  profitSum: number // sum of profits (can be positive or negative)
  lossSum: number // sum of losses (negative values)
  netProfit: number // profitSum + lossSum
}

export interface HoldingTimePoint {
  tradeId: number
  profit: number
  holdingTimeHours: number
  openTime: string
  closeTime: string
}

// ============================================================================
// TRADES SUMMARY
// ============================================================================

export interface TradesSummary {
  totalTrades: number
  profitTrades: number
  lossTrades: number

  largestProfit: number
  largestLoss: number
  averageProfit: number
  averageLoss: number

  totalProfit: number
  totalLoss: number

  winRate: number // percentage

  // Optional: sample trades for preview
  sampleTrades?: TradeSummary[]
}

export interface TradeSummary {
  orderId: number
  openTime: string
  closeTime: string
  type: 'BUY' | 'SELL'
  volume: number
  openPrice: number
  closePrice: number
  profit: number
  duration: string // HH:MM:SS
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type MetricCategory =
  | 'history'
  | 'profit'
  | 'drawdown'
  | 'ratios'
  | 'trades'
  | 'winloss'
  | 'correlation'
  | 'time'

export interface MetricDefinition {
  key: keyof PerformanceMetrics
  label: string
  category: MetricCategory
  format: 'currency' | 'percent' | 'number' | 'ratio' | 'time' | 'count'
  description: string
  icon?: string // lucide-react icon name
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format metric value based on its format type
 */
export function formatMetricValue(
  value: number | string,
  format: MetricDefinition['format']
): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent':
      return `${value.toFixed(2)}%`
    case 'ratio':
      return value.toFixed(2)
    case 'count':
    case 'number':
      return value.toLocaleString('en-US')
    case 'time':
      return value.toString() // Already formatted as HH:MM:SS
    default:
      return value.toString()
  }
}

/**
 * Get color class for metric value (profit/loss)
 */
export function getMetricColorClass(value: number, isNegativeGood = false): string {
  if (value === 0) return 'text-text-muted'

  const isPositive = value > 0
  const shouldBeGreen = isNegativeGood ? !isPositive : isPositive

  return shouldBeGreen ? 'text-accent-profit' : 'text-accent-loss'
}
