# Strategy Report Charts

Professional chart components for quantitative trading analytics built with Recharts.

## Components

### 1. EquityCurveChart
Displays equity curve with synchronized drawdown chart.

```tsx
import { EquityCurveChart } from '@/components/strategy-report/charts'

<EquityCurveChart
  equityCurve={data.charts.equityCurve}
  drawdown={data.charts.drawdown}
/>
```

**Features:**
- Dual synchronized charts (equity + drawdown)
- Balance line (green) and equity area (blue gradient)
- Drawdown area chart (red gradient)
- Responsive tooltips with formatted currency
- Height: 400px total (300px equity + 100px drawdown)

---

### 2. DistributionChartsGrid
Shows 6 distribution charts in a responsive grid.

```tsx
import { DistributionChartsGrid } from '@/components/strategy-report/charts'

<DistributionChartsGrid
  hourlyDist={data.charts.hourlyDistribution}
  dailyDist={data.charts.dailyDistribution}
  monthlyDist={data.charts.monthlyDistribution}
/>
```

**Features:**
- 3x2 grid on desktop, 2x3 on tablet, 1 column on mobile
- 3 entry distribution charts (hourly, daily, monthly) with gradient bars
- 3 P&L distribution charts with stacked profit/loss bars
- Each chart: 200px height
- Professional color scheme (orange→green, green, blue)

---

### 3. HoldingTimeScatterChart
Scatter plot showing profit vs holding time for all trades.

```tsx
import { HoldingTimeScatterChart } from '@/components/strategy-report/charts'

<HoldingTimeScatterChart
  data={data.charts.holdingTimeScatter}
/>
```

**Features:**
- Green dots for profitable trades
- Red dots for losing trades
- Reference line at Y=0
- Detailed tooltips with trade info
- Auto-formatted time labels (hours/days)
- Height: 300px

---

### 4. MFEMAEChartsGrid
Two stacked scatter plots for MAE/MFE analysis.

```tsx
import { MFEMAEChartsGrid } from '@/components/strategy-report/charts'

<MFEMAEChartsGrid
  data={data.charts.maemfe}
/>
```

**Features:**
- Top chart: Profit vs MFE (blue dots)
- Bottom chart: Profit vs MAE (orange dots)
- Reference lines at X=0 and Y=0
- Informative legend explaining MAE/MFE
- Height: 250px per chart (500px total)

---

## Design System

All charts follow the DEUS QUANT design system:

**Colors:**
- `accent-profit`: #16a34a (green)
- `accent-loss`: #dc2626 (red)
- `accent-info`: #3b82f6 (blue)
- `accent-warning`: #f59e0b (orange)
- `deus-gray`: #54585f
- `text-muted`: #a0a3a9
- `border-light`: #e5e7eb

**Components:**
- All charts use `.card` className for consistent styling
- Tooltips use `.chart-tooltip` with proper typography
- Responsive margins and sizing
- Professional gradients and opacity

---

## Usage Example

```tsx
'use client'

import { StrategyReportData } from '@/lib/types/strategy-report'
import {
  EquityCurveChart,
  DistributionChartsGrid,
  HoldingTimeScatterChart,
  MFEMAEChartsGrid,
} from '@/components/strategy-report/charts'

export function StrategyReportCharts({ data }: { data: StrategyReportData }) {
  return (
    <div className="space-y-6">
      <EquityCurveChart
        equityCurve={data.charts.equityCurve}
        drawdown={data.charts.drawdown}
      />

      <DistributionChartsGrid
        hourlyDist={data.charts.hourlyDistribution}
        dailyDist={data.charts.dailyDistribution}
        monthlyDist={data.charts.monthlyDistribution}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HoldingTimeScatterChart
          data={data.charts.holdingTimeScatter}
        />

        <MFEMAEChartsGrid
          data={data.charts.maemfe}
        />
      </div>
    </div>
  )
}
```

---

## Technical Details

- **Library:** Recharts (optimized via next.config.js)
- **All components:** Client components (`'use client'`)
- **TypeScript:** Fully typed with strategy-report types
- **Responsive:** Mobile-first design
- **Performance:** Optimized rendering with proper domains
- **Accessibility:** Proper labels and ARIA attributes
