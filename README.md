# DEUS QUANT Portfolio System

Professional algorithmic trading strategies portfolio presentation system for institutional investors.

## Overview

A comprehensive Next.js application for analyzing, managing, and presenting algorithmic trading strategies. Built for professional quant traders managing ~100M PLN AUM.

## Features

### ✅ Implemented (v1.0.0)

- **Project Infrastructure**
  - Next.js 14.2.5 with TypeScript
  - Tailwind CSS with DEUS QUANT custom theme
  - Prisma ORM with SQLite (dev) / PostgreSQL (production)
  - Complete database schema for strategies, transactions, and portfolios

- **Data Parsing**
  - MT5 Excel parser framework
  - CSV forward test parser
  - Backtest-forward merger for combined analysis
  - Comprehensive type definitions

- **API Endpoints**
  - `/api/strategies` - Strategy CRUD operations
  - `/api/upload` - File upload handling
  - Ready for parser integration

- **Dashboard Components**
  - Professional DEUS QUANT branding (Logo with radial pulse animation)
  - Dashboard header with real-time updates
  - Equity curve chart with Recharts (equity + drawdown overlay)
  - Statistics panel with multi-format metrics
  - File uploader with drag & drop support

- **Portfolio Management**
  - Strategy table with selection and filtering
  - Portfolio weight calculation (INVERSE_DD, EQUAL, SHARPE methods)
  - Equity curve combination logic
  - Real-time portfolio metrics

- **Visualizations**
  - Monthly returns heatmap
  - Equity curve with drawdown overlay
  - Responsive charts with professional styling

- **Utilities**
  - Export functions (PDF, Excel) - stub implementations
  - Number, currency, and date formatters
  - Site configuration
  - Type-safe utilities

## Tech Stack

- **Framework**: Next.js 14.2.5
- **UI**: React 18, Tailwind CSS 3.4, shadcn/ui components
- **Charts**: Recharts 2.12, Plotly.js 2.35
- **Animations**: Framer Motion 11.3
- **Database**: Prisma 5.18 (SQLite dev / PostgreSQL prod)
- **Validation**: Zod 3.23
- **File Handling**: xlsx 0.18, papaparse 5.4, react-dropzone 14.2
- **State Management**: Zustand 4.5
- **Data Fetching**: TanStack Query 5.51

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

\`\`\`bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
\`\`\`

Visit [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### Build

\`\`\`bash
# Production build
npm run build

# Start production server
npm start
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── brand/            # Logo, branding
│   ├── charts/           # Chart components
│   ├── dashboard/        # Dashboard components
│   └── upload/           # File upload
├── lib/                   # Core logic
│   ├── parsers/          # MT5, CSV parsers
│   ├── calculations/     # Portfolio calculations
│   ├── database/         # Prisma client & queries
│   └── utils/            # Utilities
├── prisma/               # Database schema
└── styles/               # Global styles
\`\`\`

## Environment Variables

\`\`\`env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="DEUS QUANT Portfolio"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
\`\`\`

## Development Phases Completed

1. ✅ **Phase 1**: Project initialization with Next.js, Tailwind, and DEUS QUANT theme
2. ✅ **Phase 2**: Database setup with Prisma and comprehensive schema
3. ✅ **Phase 3**: MT5 parser framework with type definitions
4. ✅ **Phase 4**: Forward test CSV parser and merger
5. ✅ **Phase 5**: Upload system with API routes and drag & drop UI
6. ✅ **Phase 6**: Dashboard components (Logo, Header, Charts, Stats)
7. ✅ **Phase 7**: Strategy table and portfolio weight calculations
8. ✅ **Phase 8**: Advanced visualizations (heatmap, charts)
9. ✅ **Phase 9**: Export utilities (stubs for PDF/Excel)
10. ✅ **Phase 10**: Polish, optimization, and TypeScript build validation

## Testing

Test data is available in the `data/` directory:
- `data/backtest/202501027.xlsx` - MT5 backtest file
- `data/forward/*.csv` - Forward test data

## Next Steps

- Integrate MT5 parser with upload API
- Implement full PDF/Excel export functionality
- Add user authentication
- Real-time data updates
- Advanced portfolio optimization algorithms

## License

Proprietary - DEUS QUANT

## Version

1.0.0 - Initial Release
