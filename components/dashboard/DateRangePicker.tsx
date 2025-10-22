'use client'

import { Calendar } from 'lucide-react'

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Date Inputs */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-display font-semibold text-text-primary">
            Date range
          </span>

          <div className="relative">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={handleStartDateChange}
              min={minDate}
              max={dateRange.endDate}
              className="input-deus pl-10 text-sm w-40"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          <span className="text-sm text-text-muted">-</span>

          <div className="relative">
            <input
              type="date"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
              min={dateRange.startDate}
              max={maxDate}
              className="input-deus pl-10 text-sm w-40"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => handleQuickSelect(period)}
              className={`
                px-4 py-2 rounded-md text-sm font-display font-medium transition-all
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
  )
}
