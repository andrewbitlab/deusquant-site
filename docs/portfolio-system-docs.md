# DEUS QUANT - Professional Portfolio Trading System

## 🎯 Executive Summary

**Company**: DEUS QUANT  
**Purpose**: Professional algorithmic trading strategies portfolio presentation system for institutional investors (~100M PLN AUM)  
**Brand Identity**: Minimalist, professional design with radial light motif  
**Target Deployment**: Production-ready system on Netlify

---

## 🎨 Brand & Design System

### Visual Identity
```css
/* DEUS QUANT Color Palette */
:root {
  /* Primary Colors */
  --deus-white: #ffffff;
  --deus-gray: #54585f;
  
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  
  /* Text */
  --text-primary: #54585f;
  --text-secondary: #7a7d84;
  --text-muted: #a0a3a9;
  
  /* Accent Colors for Data */
  --accent-profit: #16a34a;    /* Green for profits */
  --accent-loss: #dc2626;      /* Red for losses */
  --accent-info: #3b82f6;      /* Blue for information */
  --accent-warning: #f59e0b;   /* Amber for warnings */
  
  /* Borders & Dividers */
  --border-light: #e5e7eb;
  --border-default: #d1d5db;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(84 88 95 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(84 88 95 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(84 88 95 / 0.1);
}

/* Typography */
--font-display: 'Montserrat', sans-serif;  /* For headings */
--font-body: 'Inter', sans-serif;          /* For body text */
--font-mono: 'JetBrains Mono', monospace;  /* For numbers */
```

### Logo Integration
- Position: Top-left corner with radial burst animation on load
- Size: 40px height in navbar, scalable SVG
- Animation: Subtle pulse on hover (opacity transition)
- Usage: Main dashboard, reports header, loading states

---

## 🛠 Optimized Tech Stack

### Core Technologies
```json
{
  "framework": "Next.js 14.2.5",
  "ui": {
    "library": "shadcn/ui",
    "styling": "Tailwind CSS 3.4",
    "charts": ["Recharts 2.12", "Plotly.js 2.35"],
    "animations": "Framer Motion 11.3"
  },
  "backend": {
    "api": "Next.js API Routes",
    "orm": "Prisma 5.18",
    "validation": "Zod 3.23"
  },
  "database": {
    "development": "SQLite",
    "production": "PostgreSQL 16"
  },
  "deployment": {
    "platform": "Netlify",
    "ci": "GitHub Actions"
  }
}
```

---

## 📂 Project Structure (Optimized for Claude Code)

```
deus-quant-portfolio/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (if needed)
│   ├── api/
│   │   ├── strategies/
│   │   │   ├── load/route.ts     # GET - Load all strategies from data/
│   │   │   ├── route.ts          # GET, POST strategies
│   │   │   └── [id]/route.ts     # GET, PUT, DELETE by ID
│   │   ├── portfolio/
│   │   │   ├── route.ts          # Portfolio operations
│   │   │   └── calculate/route.ts # Real-time calculations
│   │   ├── upload/
│   │   │   ├── backtest/route.ts # POST - Save backtest file to data/backtest/
│   │   │   └── forward/route.ts  # POST - Save forward test to data/forward/
│   │   └── export/
│   │       ├── pdf/route.ts      # PDF generation
│   │       └── excel/route.ts    # Excel export
│   ├── dashboard/
│   │   ├── page.tsx               # Main dashboard (loads from data/)
│   │   ├── loading.tsx            # Loading state
│   │   └── error.tsx              # Error boundary
│   ├── upload/
│   │   └── page.tsx               # Upload page for file management
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing/redirect
│
├── components/
│   ├── brand/
│   │   ├── Logo.tsx               # DEUS QUANT logo component
│   │   └── LoadingScreen.tsx     # Branded loading
│   ├── charts/
│   │   ├── EquityCurve.tsx       # Main performance chart
│   │   ├── DrawdownChart.tsx     # Underwater chart
│   │   ├── MonthlyHeatmap.tsx    # Returns heatmap
│   │   ├── CorrelationMatrix.tsx # Strategy correlations
│   │   └── RiskReturnScatter.tsx # Risk/return plot
│   ├── dashboard/
│   │   ├── Header.tsx             # Top navigation
│   │   ├── StatsPanel.tsx         # Key metrics display
│   │   ├── StrategyTable.tsx     # Strategy selector
│   │   └── PortfolioBuilder.tsx  # Portfolio composition
│   ├── upload/
│   │   ├── FileUploader.tsx      # Drag & drop uploader
│   │   ├── ImportWizard.tsx      # Step-by-step import
│   │   └── ValidationResults.tsx # Import validation UI
│   └── ui/                       # shadcn/ui components
│
├── lib/
│   ├── parsers/
│   │   ├── mt5/
│   │   │   ├── html-parser.ts    # MT5 HTML report parser
│   │   │   ├── excel-parser.ts   # MT5 Excel parser (Polish format)
│   │   │   └── types.ts          # TypeScript types
│   │   └── csv/
│   │       ├── forward-parser.ts # Forward test CSV
│   │       └── merger.ts          # Backtest/forward merger
│   ├── data/
│   │   └── loader.ts              # Load strategies from data/ directory
│   ├── calculations/
│   │   ├── metrics.ts             # Performance metrics
│   │   ├── portfolio.ts           # Portfolio calculations
│   │   ├── risk.ts                # Risk metrics
│   │   └── correlation.ts        # Correlation analysis
│   ├── database/
│   │   ├── client.ts              # Prisma client
│   │   └── queries/
│   │       ├── strategies.ts     # Strategy queries
│   │       └── portfolio.ts      # Portfolio queries
│   └── utils/
│       ├── formatters.ts          # Number/date formatting
│       ├── validators.ts          # Input validation
│       └── constants.ts           # App constants
│
├── data/                          # File storage (source of truth)
│   ├── backtest/                  # MT5 backtest files (.xlsx)
│   │   ├── 202501021.xlsx
│   │   ├── 202501025.xlsx
│   │   └── 202501027.xlsx
│   └── forward/                   # Forward test CSV files
│       └── orders-deusfund-sqx1-2_8-10-2025.csv
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed data
│
├── public/
│   ├── logo.svg                   # DEUS QUANT logo
│   └── fonts/                     # Custom fonts
│
├── styles/
│   ├── globals.css                # Global styles
│   └── themes/
│       └── deus-quant.css         # Brand theme
│
└── config/
    ├── site.ts                    # Site configuration
    └── charts.ts                  # Chart defaults
```

---

## ⚡ Core Features Implementation

### 1. MT5 Data Parser Specification

```typescript
// lib/parsers/mt5/types.ts
export interface MT5ParseResult {
  metadata: {
    magicNumber: number;
    accountNumber?: string;
    broker?: string;
    currency: string;
    leverage?: number;
  };
  
  summary: {
    symbol: string;
    period: string;
    modelType: string;
    parameters?: Record<string, any>;
    
    // Performance metrics
    totalNetProfit: number;
    totalGrossProfit: number;
    totalGrossLoss: number;
    profitFactor: number;
    expectedPayoff: number;
    
    // Drawdown metrics
    absoluteDrawdown: number;
    maximalDrawdown: number;
    maximalDrawdownPercent: number;
    relativeDrawdown: number;
    relativeDrawdownPercent: number;
    
    // Trade statistics
    totalTrades: number;
    shortPositions: number;
    longPositions: number;
    profitTrades: number;
    lossTrades: number;
    winRate: number;
    
    // Risk metrics
    sharpeRatio?: number;
    sortinoRatio?: number;
    calmarRatio?: number;
    recoveryFactor?: number;
    
    // Series statistics
    largestProfitTrade: number;
    largestLossTrade: number;
    averageProfitTrade: number;
    averageLossTrade: number;
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
    maxConsecutiveProfit: number;
    maxConsecutiveLoss: number;
    averageConsecutiveWins: number;
    averageConsecutiveLosses: number;
  };
  
  transactions: Array<{
    id: number;
    type: 'BUY' | 'SELL' | 'BALANCE';
    openTime: Date;
    closeTime?: Date;
    symbol: string;
    volume: number;
    openPrice: number;
    closePrice?: number;
    sl?: number;
    tp?: number;
    commission: number;
    swap: number;
    profit: number;
    balance?: number;
    comment?: string;
  }>;
  
  monthlyReturns?: Map<string, number>; // YYYY-MM -> return%
  dailyEquity?: Array<{ date: Date; equity: number }>;
}

// Parser implementation guide for Claude Code
export class MT5Parser {
  static async parseHTML(file: File): Promise<MT5ParseResult> {
    // 1. Read file content
    // 2. Parse HTML structure using DOMParser
    // 3. Extract data from specific table cells
    // 4. Calculate derived metrics
    // 5. Return structured data
  }
  
  static async parseExcel(file: File): Promise<MT5ParseResult> {
    // 1. Use XLSX library to read file
    // 2. Identify data sheets
    // 3. Map cells to data structure
    // 4. Process transactions list
    // 5. Return structured data
  }
}
```

### 2. Upload System Architecture

The DEUS QUANT system uses a dedicated upload page for file management, with the dashboard displaying data loaded from the filesystem.

#### Upload Page (`/upload`)
- **Purpose**: Dedicated page for adding new backtest reports and updating forward test files
- **Location**: Accessible at `/upload` route
- **File Types**: MT5 Excel files (.xlsx) for backtests, CSV files for forward tests
- **Storage**: Files are saved directly to the filesystem in `data/` directory:
  - Backtest files → `data/backtest/`
  - Forward test files → `data/forward/`

```typescript
// app/upload/page.tsx - Upload Page Implementation
export default function UploadPage() {
  // 1. File upload interface with drag & drop
  // 2. File type validation (xlsx for backtest, csv for forward)
  // 3. Server action to save files to appropriate directory
  // 4. Success/error notifications
  // 5. List of recently uploaded files
}

// Server action for file upload
'use server'
async function uploadFile(formData: FormData, type: 'backtest' | 'forward') {
  // 1. Extract file from formData
  // 2. Validate file type and size
  // 3. Save to data/backtest/ or data/forward/
  // 4. Return success/error response
}
```

#### Dashboard Refresh Mechanism
- **Purpose**: Manually reload data from filesystem when new files are added
- **Location**: "Refresh" button in dashboard header (top-right)
- **Behavior**:
  - Scans `data/backtest/` and `data/forward/` directories
  - Parses any new or updated files
  - Updates dashboard display with latest data
  - Shows loading state during refresh
  - Displays notification on completion

```typescript
// components/dashboard/Header.tsx - Refresh Button
export function DashboardHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Call data loader to rescan directory
      const response = await fetch('/api/strategies/load')
      // Update UI with new data
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <header>
      <Logo />
      <Button onClick={handleRefresh} disabled={isRefreshing}>
        <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
        Refresh
      </Button>
    </header>
  )
}
```

#### Data Loading Flow
1. **Initial Load**: Dashboard loads all strategies from `data/` on page render
2. **Upload New File**: User navigates to `/upload`, uploads file → saved to `data/`
3. **Refresh**: User returns to dashboard, clicks "Refresh" button
4. **Reload**: System rescans `data/` directory and updates display

This architecture separates concerns:
- `/upload` page handles file management
- Dashboard focuses on data visualization
- No database complexity - files are the source of truth
- Simple, reliable, easy to maintain

### 3. Forward Test Integration

```typescript
// lib/parsers/csv/merger.ts
export class BacktestForwardMerger {
  /**
   * Merges backtest and forward test data
   * Rules:
   * 1. Use backtest data up to forward test start date
   * 2. Replace with forward data from start date onwards
   * 3. Recalculate all cumulative metrics
   * 4. Mark transition point for visualization
   */
  static merge(
    backtest: MT5ParseResult,
    forward: ForwardTestData,
    options?: {
      normalizeToInitialCapital?: number;
      markTransitionPoint?: boolean;
    }
  ): MergedStrategyData {
    // Implementation steps for Claude Code:
    // 1. Find forward test start date
    // 2. Split backtest transactions at this date
    // 3. Concatenate backtest (before) + forward (after)
    // 4. Recalculate equity curve
    // 5. Recalculate all statistics
    // 6. Add metadata about merge point
  }
}
```

### 3. Dashboard Components

```typescript
// components/dashboard/Header.tsx
export const DashboardHeader = () => {
  return (
    <header className="border-b border-border-light bg-white">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo className="h-10" />
          <div className="text-sm text-text-secondary">
            Portfolio Analytics System
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-text-muted">Last Update:</span>
            <span className="ml-2 font-mono text-text-primary">
              {new Date().toLocaleString()}
            </span>
          </div>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

// components/charts/EquityCurve.tsx
export const EquityCurve = ({ data, showDrawdown = true }) => {
  // Chart configuration for DEUS QUANT theme
  const chartConfig = {
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
    style: {
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary)'
    }
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} {...chartConfig}>
        <defs>
          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="var(--border-light)" 
          opacity={0.5}
        />
        
        <XAxis 
          dataKey="date" 
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)' }}
        />
        
        <YAxis 
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)' }}
        />
        
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px'
          }}
        />
        
        {showDrawdown && (
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="var(--accent-loss)"
            fill="url(#drawdownGradient)"
          />
        )}
        
        <Line
          type="monotone"
          dataKey="equity"
          stroke="var(--deus-gray)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--deus-gray)' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
```

### 4. Portfolio Weight Calculation

```typescript
// lib/calculations/portfolio.ts
export class PortfolioCalculator {
  /**
   * Calculate portfolio weights using Inverse Max Drawdown method
   * This method allocates more weight to strategies with lower drawdowns
   */
  static calculateWeights(
    strategies: Strategy[],
    method: 'EQUAL' | 'INVERSE_DD' | 'SHARPE' | 'CUSTOM' = 'INVERSE_DD'
  ): Map<number, number> {
    const weights = new Map<number, number>();
    
    switch (method) {
      case 'INVERSE_DD':
        const totalInverseDD = strategies.reduce((sum, s) => {
          return sum + (1 / Math.abs(s.maxDrawdown || 1));
        }, 0);
        
        strategies.forEach(s => {
          const weight = (1 / Math.abs(s.maxDrawdown || 1)) / totalInverseDD;
          weights.set(s.magicNumber, weight);
        });
        break;
        
      case 'SHARPE':
        // Weight by Sharpe ratio
        const totalSharpe = strategies.reduce((sum, s) => {
          return sum + Math.max(s.sharpeRatio || 0, 0);
        }, 0);
        
        strategies.forEach(s => {
          const weight = Math.max(s.sharpeRatio || 0, 0) / totalSharpe;
          weights.set(s.magicNumber, weight);
        });
        break;
        
      case 'EQUAL':
      default:
        strategies.forEach(s => {
          weights.set(s.magicNumber, 1 / strategies.length);
        });
    }
    
    return weights;
  }
  
  /**
   * Combine multiple strategies into portfolio equity curve
   */
  static combineEquityCurves(
    strategies: Array<{
      magicNumber: number;
      equityCurve: Array<{ date: Date; value: number }>;
      weight: number;
    }>,
    initialCapital: number = 10000
  ): Array<{ date: Date; equity: number; drawdown: number }> {
    // Implementation for Claude Code:
    // 1. Normalize each strategy to $1000 initial
    // 2. Apply weights to each normalized curve
    // 3. Sum weighted values for each date
    // 4. Scale to initial capital
    // 5. Calculate running drawdown
  }
}
```

---

## 🗄 Database Schema (Production-Ready)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // or "sqlite" for dev
  url      = env("DATABASE_URL")
}

model Strategy {
  id              String   @id @default(cuid())
  magicNumber     Int      @unique
  name            String
  symbol          String
  timeframe       String
  version         String?  @default("1.0.0")
  
  // Performance data
  backtestStart   DateTime
  backtestEnd     DateTime
  forwardStart    DateTime?
  forwardEnd      DateTime?
  
  // Cached metrics (JSON)
  backtestMetrics Json
  forwardMetrics  Json?
  combinedMetrics Json?
  
  // Equity curves (JSON arrays)
  backtestEquity  Json
  forwardEquity   Json?
  combinedEquity  Json?
  
  // Monthly returns map (JSON)
  monthlyReturns  Json?
  
  // Status
  status          StrategyStatus @default(BACKTEST)
  isActive        Boolean        @default(true)
  
  // Relations
  transactions    Transaction[]
  portfolios      PortfolioStrategy[]
  
  // Audit fields
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String?
  
  @@index([symbol, timeframe])
  @@index([status, isActive])
}

enum StrategyStatus {
  BACKTEST
  FORWARD_TEST
  PAPER_TRADING
  LIVE
  ARCHIVED
}

model Transaction {
  id            String    @id @default(cuid())
  strategyId    String
  strategy      Strategy  @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  
  // Trade data
  orderId       BigInt    @unique
  type          TradeType
  symbol        String
  volume        Decimal   @db.Decimal(10, 2)
  
  // Prices
  openPrice     Decimal   @db.Decimal(10, 5)
  closePrice    Decimal?  @db.Decimal(10, 5)
  sl            Decimal?  @db.Decimal(10, 5)
  tp            Decimal?  @db.Decimal(10, 5)
  
  // Times
  openTime      DateTime
  closeTime     DateTime?
  
  // Financial
  commission    Decimal   @db.Decimal(10, 2)
  swap          Decimal   @db.Decimal(10, 2)
  profit        Decimal   @db.Decimal(10, 2)
  balance       Decimal?  @db.Decimal(12, 2)
  
  // Meta
  comment       String?
  isForwardTest Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  
  @@index([strategyId, openTime])
  @@index([symbol])
}

enum TradeType {
  BUY
  SELL
  BUY_LIMIT
  SELL_LIMIT
  BUY_STOP
  SELL_STOP
  BALANCE
  CREDIT
}

model Portfolio {
  id            String   @id @default(cuid())
  name          String
  description   String?
  
  // Configuration
  rebalanceFreq String?  @default("MONTHLY") // DAILY, WEEKLY, MONTHLY, QUARTERLY
  weightMethod  String   @default("INVERSE_DD") // EQUAL, INVERSE_DD, SHARPE, CUSTOM
  
  // Cached calculations (JSON)
  equityCurve   Json?
  statistics    Json?
  lastCalculated DateTime?
  
  // Relations
  strategies    PortfolioStrategy[]
  
  // Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
  isPublic      Boolean  @default(false)
  
  @@index([isPublic])
}

model PortfolioStrategy {
  id            String    @id @default(cuid())
  portfolioId   String
  portfolio     Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  strategyId    String
  strategy      Strategy  @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  
  weight        Decimal   @db.Decimal(5, 4) // 0.0000 to 1.0000
  customWeight  Decimal?  @db.Decimal(5, 4) // For CUSTOM weight method
  enabled       Boolean   @default(true)
  
  addedAt       DateTime  @default(now())
  
  @@unique([portfolioId, strategyId])
  @@index([enabled])
}

// For audit log
model AuditLog {
  id            String   @id @default(cuid())
  action        String   // CREATE, UPDATE, DELETE, IMPORT, EXPORT
  entityType    String   // Strategy, Portfolio, Transaction
  entityId      String
  changes       Json?    // JSON diff of changes
  userId        String?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())
  
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

---

## 📦 Package Dependencies (Exact Versions)

```json
{
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@prisma/client": "5.18.0",
    "tailwindcss": "3.4.7",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.4.0",
    "recharts": "2.12.7",
    "plotly.js-basic-dist": "2.35.0",
    "react-plotly.js": "2.6.0",
    "framer-motion": "11.3.19",
    "@radix-ui/react-dialog": "1.1.1",
    "@radix-ui/react-dropdown-menu": "2.1.1",
    "@radix-ui/react-select": "2.1.1",
    "@radix-ui/react-tabs": "1.1.0",
    "@radix-ui/react-toast": "1.2.1",
    "lucide-react": "0.408.0",
    "date-fns": "3.6.0",
    "zod": "3.23.8",
    "react-hook-form": "7.52.1",
    "@hookform/resolvers": "3.7.0",
    "xlsx": "0.18.5",
    "papaparse": "5.4.1",
    "@react-pdf/renderer": "3.4.4",
    "react-dropzone": "14.2.3",
    "zustand": "4.5.4",
    "@tanstack/react-query": "5.51.11",
    "@tanstack/react-table": "8.19.3"
  },
  "devDependencies": {
    "@types/node": "20.14.12",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@types/papaparse": "5.3.14",
    "typescript": "5.5.4",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "prettier": "3.3.3",
    "prisma": "5.18.0",
    "@testing-library/react": "16.0.0",
    "@testing-library/jest-dom": "6.4.8",
    "jest": "29.7.0",
    "jest-environment-jsdom": "29.7.0"
  }
}
```

---

## 🚀 MVP Development Roadmap

### Phase 1: Project Setup (Day 1)
```bash
# Commands for Claude Code to execute
npx create-next-app@latest deus-quant-portfolio --typescript --tailwind --app
cd deus-quant-portfolio
npm install @radix-ui/react-dialog @radix-ui/react-select lucide-react
npx shadcn-ui@latest init
npx prisma init --datasource-provider sqlite
```

### Phase 2: Core Infrastructure (Days 2-3)
- [ ] Configure DEUS QUANT theme in `tailwind.config.js`
- [ ] Set up Prisma schema
- [ ] Create base layouts with brand identity
- [ ] Implement Logo component with animations
- [ ] Set up API route structure

### Phase 3: Data Import (Days 4-6)
- [ ] MT5 HTML parser with full metrics extraction
- [ ] Excel parser as fallback
- [ ] CSV forward test parser
- [ ] Data validation and error handling
- [ ] Upload UI with progress indicators

### Phase 4: Dashboard Implementation (Days 7-9)
- [ ] Main dashboard layout with data loader
- [ ] Equity curve chart with Recharts
- [ ] Statistics panel with metric cards
- [ ] Strategy table with sorting/filtering
- [ ] Portfolio calculations from filesystem data

### Phase 5: Upload Page Implementation (Days 10-11)
- [ ] Create `/upload` page with file upload interface
- [ ] Implement drag & drop for backtest (.xlsx) and forward (.csv) files
- [ ] Server actions to save files to `data/backtest/` and `data/forward/`
- [ ] File validation and error handling
- [ ] Success notifications and upload history

### Phase 6: Dashboard Refresh Feature (Day 12)
- [ ] Add "Refresh" button to dashboard header
- [ ] Implement data reload mechanism (rescan `data/` directory)
- [ ] Loading state with spinning icon
- [ ] Toast notifications on success/error
- [ ] Update last refresh timestamp

### Phase 7: Advanced Visualizations (Days 13-14)
- [ ] Portfolio weight optimization (INVERSE_DD, SHARPE, EQUAL)
- [ ] Correlation matrix visualization
- [ ] Monthly returns heatmap
- [ ] Risk/return scatter plot
- [ ] Performance comparison tools

### Phase 8: Export & Polish (Days 14-15)
- [ ] PDF report generation
- [ ] Excel export functionality
- [ ] Performance optimization
- [ ] Error boundaries and logging
- [ ] Deployment configuration

---

## 🎯 Critical Success Factors for Claude Code

### 1. File Parsing Accuracy
```typescript
// CRITICAL: MT5 HTML structure varies by broker
// Always implement defensive parsing:
const parseMetric = (row: HTMLElement): number => {
  const value = row.querySelector('td:last-child')?.textContent || '0';
  return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
};
```

### 2. Performance Optimization
```typescript
// Use React.memo for heavy components
export const EquityCurve = React.memo(({ data }) => {
  // Virtualize large datasets
  const virtualizedData = useMemo(() => {
    if (data.length > 1000) {
      // Sample every nth point for visualization
      return data.filter((_, i) => i % Math.ceil(data.length / 1000) === 0);
    }
    return data;
  }, [data]);
  
  return <Chart data={virtualizedData} />;
});
```

### 3. Error Handling
```typescript
// Wrap all parsers in try-catch with meaningful errors
export const safeParse = async <T>(
  parser: () => Promise<T>,
  context: string
): Promise<Result<T>> => {
  try {
    const result = await parser();
    return { success: true, data: result };
  } catch (error) {
    console.error(`Parse error in ${context}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
```

### 4. State Management Pattern
```typescript
// Use Zustand for global state
import { create } from 'zustand';

interface PortfolioStore {
  strategies: Strategy[];
  selectedIds: Set<number>;
  weights: Map<number, number>;
  
  toggleStrategy: (id: number) => void;
  updateWeights: (method: WeightMethod) => void;
  calculatePortfolio: () => PortfolioResult;
}
```

---

## 🔐 Security & Production Considerations

### Environment Variables
```env
# .env.local
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="DEUS QUANT Portfolio"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# .env.production
DATABASE_URL="${POSTGRES_URL}"
NEXT_PUBLIC_APP_NAME="DEUS QUANT Portfolio"
NEXT_PUBLIC_API_URL="https://portfolio.deusquant.com/api"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] API rate limiting implemented
- [ ] File upload size limits (10MB)
- [ ] Input sanitization on all endpoints
- [ ] CORS properly configured
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics)
- [ ] SEO meta tags
- [ ] Open Graph images

---

## 📝 Claude Code Implementation Instructions

When implementing this system with Claude Code, follow this sequence:

### Step 1: Initialize Project
```bash
# Create Next.js app with exact configuration
npx create-next-app@latest deus-quant-portfolio \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

### Step 2: Install All Dependencies
```bash
# Install in one command to avoid version conflicts
npm install next@14.2.5 react@18.3.1 react-dom@18.3.1 \
  @prisma/client@5.18.0 prisma@5.18.0 \
  recharts@2.12.7 framer-motion@11.3.19 \
  lucide-react@0.408.0 zod@3.23.8 \
  xlsx@0.18.5 papaparse@5.4.1 \
  zustand@4.5.4 @tanstack/react-query@5.51.11
```

### Step 3: Component Creation Order
1. Theme configuration (`tailwind.config.js`)
2. Logo and brand components
3. Layout components (Header, Navigation)
4. Upload components (prioritize functionality)
5. Parser implementations (MT5 first)
6. Chart components (Equity curve first)
7. Dashboard assembly
8. Advanced features

### Step 4: Testing Data
Create sample MT5 HTML files for testing:
- Profitable strategy (high Sharpe)
- Losing strategy (for contrast)
- Mixed performance (realistic)

### Step 5: Performance Monitoring
```typescript
// Add performance tracking
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      console.log('Performance metrics:', performance.getEntriesByType('navigation'));
    });
  }
}
```

---

## 🤝 Support & Maintenance

### Common Issues & Solutions

**Issue**: Large MT5 files (>5MB) slow to parse  
**Solution**: Use Web Workers for parsing
```typescript
// lib/workers/parser.worker.ts
self.addEventListener('message', async (event) => {
  const { file, type } = event.data;
  const result = await parseFile(file, type);
  self.postMessage(result);
});
```

**Issue**: Memory leaks with large portfolios  
**Solution**: Implement cleanup in useEffect
```typescript
useEffect(() => {
  const subscription = portfolioStore.subscribe(/* ... */);
  return () => subscription.unsubscribe();
}, []);
```

**Issue**: Chart performance with many data points  
**Solution**: Data decimation and viewport culling

---

## ✅ Quality Assurance Checklist

### Before Deployment
- [ ] All parsers handle edge cases
- [ ] Charts responsive on all screen sizes
- [ ] Portfolio calculations verified against Excel
- [ ] PDF exports properly formatted
- [ ] Loading states for all async operations
- [ ] Error boundaries catch all errors
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Performance (Lighthouse score >90)
- [ ] Security headers configured
- [ ] Documentation complete

---

## 📚 Additional Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [MT5 Report Format](https://www.metatrader5.com/en/terminal/help)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)

---

*This documentation is optimized for Claude Code implementation. Each section provides specific implementation details and code examples that Claude can use to build the system correctly on the first attempt.*