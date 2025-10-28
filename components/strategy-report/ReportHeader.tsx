'use client'

import type { StrategyInfo } from '@/lib/types/strategy-report'
import { FileText } from 'lucide-react'

interface ReportHeaderProps {
  strategyInfo: StrategyInfo
}

export function ReportHeader({ strategyInfo }: ReportHeaderProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-deus-gray/10 rounded-lg flex items-center justify-center">
        <FileText className="w-6 h-6 text-deus-gray" />
      </div>

      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary">
          {strategyInfo.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Symbol:</span>
            <span className="font-mono font-semibold">{strategyInfo.symbol}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-muted">Timeframe:</span>
            <span className="font-mono font-semibold">{strategyInfo.timeframe}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-muted">Period:</span>
            <span className="font-mono">
              {formatDate(strategyInfo.periodStart)} - {formatDate(strategyInfo.periodEnd)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-muted">Magic #:</span>
            <span className="font-mono font-semibold">{strategyInfo.magicNumber}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
