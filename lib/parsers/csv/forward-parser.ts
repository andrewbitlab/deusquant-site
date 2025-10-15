import Papa from 'papaparse'

export interface ForwardTestTrade {
  date: Date
  type: 'BUY' | 'SELL'
  symbol: string
  volume: number
  price: number
  profit: number
  balance: number
}

export interface ForwardTestData {
  trades: ForwardTestTrade[]
  startDate: Date
  endDate: Date
  totalProfit: number
  totalTrades: number
}

/**
 * CSV Forward Test Parser
 * Parses forward test results from CSV format
 */
export class ForwardCSVParser {
  static async parseFile(file: File): Promise<ForwardTestData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const trades: ForwardTestTrade[] = results.data
              .map((row: any) => ({
                date: new Date(row.Date || row.date || row.Time || row.time),
                type: (String(row.Type || row.type).toUpperCase().includes('BUY')
                  ? 'BUY'
                  : 'SELL') as 'BUY' | 'SELL',
                symbol: String(row.Symbol || row.symbol || ''),
                volume: parseFloat(row.Volume || row.volume || 0),
                price: parseFloat(row.Price || row.price || 0),
                profit: parseFloat(row.Profit || row.profit || 0),
                balance: parseFloat(row.Balance || row.balance || 0),
              }))
              .filter((t): t is ForwardTestTrade => t.date && !isNaN(t.date.getTime()))

            const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0)

            resolve({
              trades,
              startDate: trades[0]?.date || new Date(),
              endDate: trades[trades.length - 1]?.date || new Date(),
              totalProfit,
              totalTrades: trades.length,
            })
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          reject(error)
        },
      })
    })
  }
}
