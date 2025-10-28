'use client'

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

export type DateRange = {
  startDate: string // ISO date string YYYY-MM-DD
  endDate: string // ISO date string YYYY-MM-DD
}

export type QuickSelectPeriod = '1M' | '3M' | '6M' | '12M' | '36M' | '60M' | 'YTD' | 'MAX'

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange, period?: QuickSelectPeriod) => void
  minDate?: string // Earliest available date
  maxDate?: string // Latest available date
  activePeriod?: QuickSelectPeriod | null
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
  activePeriod,
}: DateRangePickerProps) {
  const periods: QuickSelectPeriod[] = ['1M', '3M', '6M', '12M', '36M', '60M', 'YTD', 'MAX']

  const handleQuickSelect = (period: QuickSelectPeriod) => {
    if (!maxDate) return

    const endDate = new Date(maxDate)
    let startDate = new Date(maxDate)

    switch (period) {
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '12M':
        startDate.setMonth(startDate.getMonth() - 12)
        break
      case '36M':
        startDate.setMonth(startDate.getMonth() - 36)
        break
      case '60M':
        startDate.setMonth(startDate.getMonth() - 60)
        break
      case 'YTD':
        startDate = new Date(endDate.getFullYear(), 0, 1) // January 1st of current year
        break
      case 'MAX':
        startDate = minDate ? new Date(minDate) : startDate
        break
    }

    // Ensure start date is not before minDate
    if (minDate && startDate < new Date(minDate)) {
      startDate = new Date(minDate)
    }

    onDateRangeChange(
      {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      period
    )
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...dateRange,
      startDate: e.target.value,
    })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...dateRange,
      endDate: e.target.value,
    })
  }

  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Date Inputs */}
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-display font-semibold text-text-primary">
            Date range
          </span>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-shrink-0">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={handleStartDateChange}
                min={minDate}
                max={dateRange.endDate}
                className="input-deus pl-8 sm:pl-10 text-xs sm:text-sm w-[130px] sm:w-36 md:w-40"
              />
              <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-text-muted pointer-events-none" />
            </div>

            <span className="text-xs sm:text-sm text-text-muted flex-shrink-0">-</span>

            <div className="relative flex-shrink-0">
              <input
                type="date"
                value={dateRange.endDate}
                onChange={handleEndDateChange}
                min={dateRange.startDate}
                max={maxDate}
                className="input-deus pl-8 sm:pl-10 text-xs sm:text-sm w-[130px] sm:w-36 md:w-40"
              />
              <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Select Buttons - Horizontal scrollable on mobile with visual hints */}
        <div className="relative">
          {/* Subtle label for clarity - helps users understand what these buttons do */}
          <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1.5 sm:hidden font-display">
            Swipe to select period →
          </div>

          {/* Shadow-based scroll indicators with arrow icons */}
          <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none sm:hidden" style={{ background: 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))' }}>
            <div className="absolute left-1 top-1/2 -translate-y-1/2">
              <ChevronLeft className="h-4 w-4 text-deus-gray/50" aria-hidden="true" />
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none sm:hidden" style={{ background: 'linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))' }}>
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <ChevronRight className="h-4 w-4 text-deus-gray/50" aria-hidden="true" />
            </div>
          </div>

          <div className="flex overflow-x-auto items-center gap-2 pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide snap-x snap-mandatory" role="tablist" aria-label="Time period selection">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => handleQuickSelect(period)}
                className={`
                  flex-shrink-0 snap-center px-4 py-2 rounded-md text-sm font-display font-medium transition-all
                  ${
                    activePeriod === period
                      ? 'bg-deus-gray text-white shadow-md'
                      : 'bg-white text-text-secondary border border-border-default hover:bg-bg-secondary hover:border-deus-gray'
                  }
                `}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
