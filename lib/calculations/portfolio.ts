export type WeightMethod = 'EQUAL' | 'INVERSE_DD' | 'SHARPE' | 'CUSTOM'

export interface StrategyMetrics {
  id: string
  maxDrawdown: number
  sharpeRatio: number
}

export interface PortfolioWeights {
  [strategyId: string]: number
}

/**
 * Portfolio weight calculation methods
 */
export class PortfolioCalculator {
  /**
   * Calculate weights using specified method
   */
  static calculateWeights(
    strategies: StrategyMetrics[],
    method: WeightMethod = 'INVERSE_DD'
  ): PortfolioWeights {
    const weights: PortfolioWeights = {}

    switch (method) {
      case 'INVERSE_DD':
        const totalInverseDD = strategies.reduce((sum, s) => {
          return sum + 1 / Math.max(Math.abs(s.maxDrawdown), 0.01)
        }, 0)

        strategies.forEach((s) => {
          weights[s.id] =
            1 / Math.max(Math.abs(s.maxDrawdown), 0.01) / totalInverseDD
        })
        break

      case 'SHARPE':
        const totalSharpe = strategies.reduce((sum, s) => {
          return sum + Math.max(s.sharpeRatio, 0)
        }, 0)

        strategies.forEach((s) => {
          weights[s.id] = Math.max(s.sharpeRatio, 0) / (totalSharpe || 1)
        })
        break

      case 'EQUAL':
      default:
        const equalWeight = 1 / strategies.length
        strategies.forEach((s) => {
          weights[s.id] = equalWeight
        })
    }

    return weights
  }

  /**
   * Combine equity curves with weights
   */
  static combineEquityCurves(
    curves: Array<{
      strategyId: string
      data: Array<{ date: Date; equity: number }>
      weight: number
    }>,
    initialCapital: number = 10000
  ): Array<{ date: Date; equity: number }> {
    if (curves.length === 0) return []

    // Normalize each curve to $1000, apply weights, and combine
    const allDates = new Set<number>()
    curves.forEach((curve) => {
      curve.data.forEach((point) => allDates.add(point.date.getTime()))
    })

    const sortedDates = Array.from(allDates).sort()
    const combined: Array<{ date: Date; equity: number }> = []

    sortedDates.forEach((timestamp) => {
      const date = new Date(timestamp)
      let totalEquity = 0

      curves.forEach((curve) => {
        // Find equity at this date
        const point = curve.data.find((p) => p.date.getTime() === timestamp)
        if (point) {
          // Normalize to $1000 initial
          const normalizedEquity = (point.equity / point.equity) * 1000
          totalEquity += normalizedEquity * curve.weight
        }
      })

      combined.push({
        date,
        equity: (totalEquity * initialCapital) / 1000,
      })
    })

    return combined
  }
}
