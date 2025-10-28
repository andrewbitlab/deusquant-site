/**
 * MT5 HTML Report Parser
 * Extracts all metrics and data from MetaTrader 5 HTML backtest reports
 * Handles UTF-16 LE encoding used by MT5
 */

import fs from 'fs'
import path from 'path'
import type {
  PerformanceMetrics,
  StrategyInfo,
  StrategySettings,
  ChartData,
} from '../types/strategy-report'

const BACKTEST_HTML_DIR = path.join(process.cwd(), 'data', 'backtest', 'html')

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export async function parseMT5HTMLReport(magicNumber: string): Promise<{
  strategyInfo: StrategyInfo
  settings: StrategySettings
  metrics: PerformanceMetrics
  charts: ChartData
}> {
  const htmlPath = path.join(BACKTEST_HTML_DIR, `${magicNumber}.html`)

  // Check if HTML file exists
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML report not found for strategy ${magicNumber}`)
  }

  // Read HTML file with UTF-16 LE encoding (MT5 format)
  const htmlContent = fs.readFileSync(htmlPath, 'utf16le')

  // Parse different sections
  const strategyInfo = parseStrategyInfo(htmlContent, magicNumber)
  const settings = parseSettings(htmlContent)
  const metrics = parseMetrics(htmlContent)
  const charts = parseChartData(htmlContent, magicNumber)

  return {
    strategyInfo,
    settings,
    metrics,
    charts,
  }
}

// ============================================================================
// STRATEGY INFO PARSER
// ============================================================================

function parseStrategyInfo(html: string, magicNumber: string): StrategyInfo {
  // Extract broker and build
  const brokerMatch = html.match(/<b>([^<]+)\s+\(Build\s+(\d+)\)<\/b>/)
  const broker = brokerMatch ? brokerMatch[1] : 'Unknown Broker'
  const build = brokerMatch ? brokerMatch[2] : 'Unknown'

  // Extract expert name
  const expertMatch = html.match(/Ekspert:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/)
  const expertName = expertMatch ? expertMatch[1] : `Strategy ${magicNumber}`

  // Extract instrument
  const instrumentMatch = html.match(/Instrument:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/)
  const symbol = instrumentMatch ? instrumentMatch[1].replace('_bt', '') : 'UNKNOWN'

  // Extract period (timeframe and date range)
  const periodMatch = html.match(/Okres:\s*<\/td>\s*<td[^>]*><b>([^(]+)\(([^)]+)\)<\/b>/)
  const timeframe = periodMatch ? periodMatch[1].trim() : 'H1'
  const dateRange = periodMatch ? periodMatch[2].trim() : ''

  // Parse date range
  const dates = dateRange.split('-').map(d => d.trim())
  const periodStart = dates[0] ? new Date(dates[0]) : new Date()
  const periodEnd = dates[1] ? new Date(dates[1]) : new Date()

  return {
    magicNumber,
    name: expertName,
    expertName,
    symbol,
    timeframe,
    periodStart,
    periodEnd,
    broker,
    build,
  }
}

// ============================================================================
// SETTINGS PARSER
// ============================================================================

function parseSettings(html: string): StrategySettings {
  // Extract company
  const companyMatch = html.match(/Firma:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/)
  const company = companyMatch ? companyMatch[1] : 'Unknown'

  // Extract currency
  const currencyMatch = html.match(/Waluta:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/)
  const currency = currencyMatch ? currencyMatch[1] : 'USD'

  // Extract initial deposit
  const depositMatch = html.match(/Depozyt Pocz.*?tkowy:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/)
  const depositStr = depositMatch ? depositMatch[1].replace(/\s/g, '') : '10000.00'
  const initialDeposit = parseFloat(depositStr)

  // Extract leverage
  const leverageMatch = html.match(/D.*?zwignia:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/)
  const leverage = leverageMatch ? leverageMatch[1] : '1:500'

  // Extract input parameters
  const inputs: Record<string, string | number | boolean> = {}
  const inputRegex = /Parametry wej.*?cia:[\s\S]*?(<tr[\s\S]*?<\/tr>)/g
  let match

  while ((match = inputRegex.exec(html)) !== null) {
    const rowHtml = match[1]
    const paramMatch = rowHtml.match(/<b>([^=]+)=([^<]+)<\/b>/)
    if (paramMatch) {
      const key = paramMatch[1].trim()
      const value = paramMatch[2].trim()

      // Try to parse as number or boolean
      if (value === 'true') inputs[key] = true
      else if (value === 'false') inputs[key] = false
      else if (!isNaN(Number(value))) inputs[key] = Number(value)
      else inputs[key] = value
    }
  }

  return {
    company,
    currency,
    initialDeposit,
    leverage,
    inputs,
  }
}

// ============================================================================
// METRICS PARSER
// ============================================================================

function parseMetrics(html: string): PerformanceMetrics {
  // Helper function to extract numeric value
  const extractNumber = (label: string): number => {
    // Handle Polish special characters and various label formats
    const escapedLabel = label
      .replace(/ą/g, '.*?')
      .replace(/ć/g, '.*?')
      .replace(/ę/g, '.*?')
      .replace(/ł/g, '.*?')
      .replace(/ń/g, '.*?')
      .replace(/ó/g, '.*?')
      .replace(/ś/g, '.*?')
      .replace(/ź/g, '.*?')
      .replace(/ż/g, '.*?')

    // Updated regex to capture percentages and plain numbers
    const regex = new RegExp(`${escapedLabel}[\\s\\S]*?<b>([0-9.,\\s%-]+)(?:\\s*\\([^)]*\\))?<\\/b>`, 'i')
    const match = html.match(regex)

    if (!match) return 0

    // Remove spaces, replace comma with dot, and remove % sign
    const valueStr = match[1].replace(/\s/g, '').replace(',', '.').replace('%', '')
    return parseFloat(valueStr) || 0
  }

  // Helper to extract number with percentage
  const extractNumberWithPercent = (label: string): { value: number; percent: number } => {
    const escapedLabel = label
      .replace(/ą/g, '.*?')
      .replace(/ć/g, '.*?')
      .replace(/ę/g, '.*?')
      .replace(/ł/g, '.*?')
      .replace(/ń/g, '.*?')
      .replace(/ó/g, '.*?')
      .replace(/ś/g, '.*?')
      .replace(/ź/g, '.*?')
      .replace(/ż/g, '.*?')

    const regex = new RegExp(
      `${escapedLabel}[\\s\\S]*?<b>([0-9.,\\s-]+)\\s*\\(([0-9.,\\s]+)%\\)<\\/b>`,
      'i'
    )
    const match = html.match(regex)

    if (!match) return { value: 0, percent: 0 }

    const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.')) || 0
    const percent = parseFloat(match[2].replace(/\s/g, '').replace(',', '.')) || 0

    return { value, percent }
  }

  // Helper to extract time value
  const extractTime = (label: string): string => {
    const regex = new RegExp(`${label}[\\s\\S]*?<b>([0-9:]+)<\\/b>`, 'i')
    const match = html.match(regex)
    return match ? match[1] : '00:00:00'
  }

  // Parse all metrics
  return {
    // History Quality
    historyQuality: extractNumber('Jako.*? Historii'),
    bars: Math.round(extractNumber('S.*?upki')),
    tickChart: Math.round(extractNumber('Wykres tickowy')),
    symbols: Math.round(extractNumber('Symbole')),

    // Profit Metrics
    totalNetProfit: extractNumber('Zysk Netto Og.*?łem'),
    grossProfit: extractNumber('Zysk Brutto'),
    grossLoss: extractNumber('Strata Brutto'),

    // Drawdown Metrics - Balance
    balanceDrawdownAbsolute: extractNumber('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Salda'),
    balanceDrawdownRelativeDollars: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Salda').value,
    balanceDrawdownRelativePercent: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Salda').percent,
    balanceDrawdownMaxDollars: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Salda').value,
    balanceDrawdownMaxPercent: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Salda').percent,

    // Drawdown Metrics - Equity
    equityDrawdownAbsolute: extractNumber('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Equity'),
    equityDrawdownRelativeDollars: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Equity').value,
    equityDrawdownRelativePercent: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Equity').percent,
    equityDrawdownMaxDollars: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Equity').value,
    equityDrawdownMaxPercent: extractNumberWithPercent('Wzgl.*?dne Obsuni.*?cia Kapita.*?u Equity').percent,

    // Performance Ratios
    profitFactor: extractNumber('Wska.*?nik Zysku'),
    expectedPayoff: extractNumber('Oczekiwany Payoff'),
    marginLevel: extractNumber('Poziom depozytu'),
    recoveryFactor: extractNumber('Wska.*?nik Odzyskania Kapita.*?u'),
    sharpeRatio: extractNumber("Wska.*?nik Sharpe'a"),
    zScore: extractNumberWithPercent('Z-Score').value,
    zScorePercent: extractNumberWithPercent('Z-Score').percent,
    ahpr: extractNumberWithPercent('AHPR').value,
    ahprPercent: extractNumberWithPercent('AHPR').percent,
    ghpr: extractNumberWithPercent('GHPR').value,
    ghprPercent: extractNumberWithPercent('GHPR').percent,
    lrCorrelation: extractNumber('Korelacja LR'),
    lrStandardError: extractNumber('LR B.*?.*?d Standardowy'),
    onTesterResult: extractNumber('Rezultat OnTester'),

    // Trade Statistics
    totalTrades: Math.round(extractNumber('Wszystkie Transakcje')),
    totalDeals: Math.round(extractNumber('Wszystkie Umowy')),
    shortTrades: Math.round(extractNumberWithPercent('Short Trades').value),
    shortTradesWinPercent: extractNumberWithPercent('Short Trades').percent,
    longTrades: Math.round(extractNumberWithPercent('Long Trades').value),
    longTradesWinPercent: extractNumberWithPercent('Long Trades').percent,
    profitTrades: Math.round(extractNumberWithPercent('Profit Trades').value),
    profitTradesPercent: extractNumberWithPercent('Profit Trades').percent,
    lossTrades: Math.round(extractNumberWithPercent('Loss Trades').value),
    lossTradesPercent: extractNumberWithPercent('Loss Trades').percent,

    // Win/Loss Analysis
    largestProfitTrade: extractNumber('Najwi.*?ksz.*? zyskown.*? transakcj.*?'),
    largestLossTrade: extractNumber('Najwi.*?ksz.*? stratn.*? transakcj.*?'),
    averageProfitTrade: extractNumber('.*?rednia zyskown.*? transakcj.*?'),
    averageLossTrade: extractNumber('.*?rednia stratn.*? transakcj.*?'),
    maxConsecutiveWins: Math.round(extractNumberWithPercent('Maksimum kolejne wygrane').value),
    maxConsecutiveWinsDollars: extractNumberWithPercent('Maksimum kolejne wygrane').percent, // Actually dollars
    maxConsecutiveLosses: Math.round(extractNumberWithPercent('Maksimum kolejne straty').value),
    maxConsecutiveLossesDollars: extractNumberWithPercent('Maksimum kolejne straty').percent, // Actually dollars
    maxProfitDollars: extractNumberWithPercent('Maksimum zysk').value,
    maxProfitCount: Math.round(extractNumberWithPercent('Maksimum zysk').percent), // Actually count
    maxLossDollars: extractNumberWithPercent('Maksimum straty').value,
    maxLossCount: Math.round(extractNumberWithPercent('Maksimum straty').percent), // Actually count
    averageConsecutiveWins: extractNumber('.*?rednia kolejne wygrane'),
    averageConsecutiveLosses: extractNumber('.*?rednia kolejne straty'),

    // Correlation Metrics
    correlationProfitMFE: extractNumber('Korelacja.*?Zyski.*?MFE'),
    correlationProfitMAE: extractNumber('Korelacja.*?Zyski.*?MAE'),
    correlationMFEMAE: extractNumber('Korelacja.*?MFE.*?MAE'),

    // Time-based Metrics
    minHoldingTime: extractTime('Minimalny czas trzymania pozycji'),
    maxHoldingTime: extractTime('Maksymalny czas trzymania pozycji'),
    avgHoldingTime: extractTime('.*?redni czas trzymania pozycji'),
  }
}

// ============================================================================
// CHART DATA PARSER
// ============================================================================

function parseChartData(html: string, magicNumber: string): ChartData {
  // For now, return empty arrays
  // These will be populated from database transactions or chart image analysis
  return {
    equityCurve: [],
    drawdown: [],
    maemfe: [],
    profitDistribution: [],
    holdingTime: [],
  }
}

// ============================================================================
// CHART IMAGE PATHS
// ============================================================================

export function getChartImagePaths(magicNumber: string): {
  equityCurve: string | null
  histogram: string | null
  maemfe: string | null
  holding: string | null
} {
  const checkImageExists = (filename: string): boolean => {
    return fs.existsSync(path.join(BACKTEST_HTML_DIR, filename))
  }

  return {
    equityCurve: checkImageExists(`${magicNumber}.png`) ? `/api/backtest/images/${magicNumber}.png` : null,
    histogram: checkImageExists(`${magicNumber}-hst.png`) ? `/api/backtest/images/${magicNumber}-hst.png` : null,
    maemfe: checkImageExists(`${magicNumber}-mfemae.png`) ? `/api/backtest/images/${magicNumber}-mfemae.png` : null,
    holding: checkImageExists(`${magicNumber}-holding.png`) ? `/api/backtest/images/${magicNumber}-holding.png` : null,
  }
}
