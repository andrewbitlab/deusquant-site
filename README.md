# DEUS QUANT Portfolio System

Professional algorithmic trading strategies portfolio presentation system for institutional investors.

## Overview

A comprehensive Next.js application for analyzing, managing, and presenting algorithmic trading strategies. Built for professional quant traders managing ~100M PLN AUM.

## Features

### ✅ Implemented (v1.0.0)

- **Project Infrastructure**
  - Next.js 14.2.5 with TypeScript
  - Tailwind CSS with DEUS QUANT custom theme
  - Prisma ORM with PostgreSQL (Neon) - Production-ready with connection pooling
  - Complete database schema for strategies, transactions, and portfolios
  - Health monitoring endpoint for system status

- **Data Parsing**
  - MT5 Excel parser framework
  - CSV forward test parser
  - Backtest-forward merger for combined analysis
  - Comprehensive type definitions

- **API Endpoints**
  - `/api/strategies` - Strategy CRUD operations
  - `/api/strategies/load` - Load strategies from database
  - `/api/health` - System health check and database monitoring
  - `/api/upload` - File upload handling
  - `/api/backtest/images/[filename]` - Backtest chart images
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
- **Database**: Prisma 5.18 with PostgreSQL (Neon) - Connection pooling with singleton pattern
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

**Development (.env.local):**
\`\`\`env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
NEXT_PUBLIC_APP_NAME="DEUS QUANT Portfolio"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
\`\`\`

**Production (Netlify):**
\`\`\`env
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
NODE_VERSION="20"
NPM_FLAGS="--legacy-peer-deps"
\`\`\`

### Netlify Production Reliability Checklist

- Add `DATABASE_URL` in Netlify environment variables for `production` context.
- Keep SSL enabled in the connection string (`sslmode=require`).
- Monitor `/api/health` after each deploy (`200` expected in healthy state).
- Production build runs `scripts/prebuild-check.mjs` and fails fast when `DATABASE_URL` is missing or invalid.

### GitHub IaC/CI for Netlify (Automatic)

Repository includes workflow: `.github/workflows/netlify-iac-deploy.yml`

What it does on each push to `main`:
- syncs required production env vars in Netlify (`DATABASE_URL`, `NODE_VERSION`, `NPM_FLAGS`)
- verifies that `DATABASE_URL` exists in Netlify production context
- triggers a production Netlify build via API

Required GitHub Actions secrets:
- `NETLIFY_AUTH_TOKEN` (personal access token for Netlify API/CLI)
- `NETLIFY_SITE_ID` (target Netlify site ID)
- `NETLIFY_DATABASE_URL_PRODUCTION` (PostgreSQL connection string for production)

Important:
- `NETLIFY_SITE_ID` must point to an active (not cancelled/disabled) Netlify project.
- `NETLIFY_AUTH_TOKEN` must have write access to that project (read-only tokens can validate site info but cannot sync env vars or trigger builds).
- If Netlify env API returns `404` for your account/plan, set `DATABASE_URL` once in Netlify UI and keep CI for deployment triggering.

Script used by workflow:
- `scripts/ci/netlify-iac-deploy.sh`

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

### Automated Testing

The project uses MCP (Model Context Protocol) tools for comprehensive testing:

```bash
# Playwright MCP - Functional testing
- Navigation and user interactions
- Data loading verification
- Accessibility snapshots
- Console error detection

# Chrome DevTools MCP - Performance testing
- Core Web Vitals (LCP, CLS, TTFB)
- Network request analysis
- Performance trace recording
- Cache analysis
```

**Latest Test Results (28 Oct 2025):**
- ✅ Localhost: PASS (4.8s load, 0 errors)
- ✅ Production: PASS (6s load, 0 errors)
- ✅ 19 strategies loading successfully
- ✅ PostgreSQL connection stable
- ✅ CLS = 0.00 (perfect, no layout shifts)

## Production Status & Monitoring

### Live Environment

**Production URL:** https://deusquant.com
**Status:** 🟢 Operational
**Database:** PostgreSQL (Neon)
**Hosting:** Netlify Serverless
**Last Deploy:** Oct 28, 2025

### Health Check Endpoint

Monitor system health and database connectivity:

```bash
# Check service status
curl https://deusquant.com/api/health

# Expected response (healthy):
{
  "status": "ok",
  "timestamp": "2025-10-28T12:56:18.216Z",
  "database": {
    "status": "connected",
    "provider": "postgresql",
    "activeStrategies": 19
  },
  "service": "deus-quant-portfolio"
}

# Error response (unhealthy):
{
  "status": "error",
  "timestamp": "2025-10-28T12:56:18.216Z",
  "database": {
    "status": "disconnected",
    "error": "Connection timeout"
  },
  "service": "deus-quant-portfolio"
}
```

**HTTP Status Codes:**
- `200 OK` - System healthy, database connected
- `503 Service Unavailable` - Database connection failed

### Performance Metrics

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** 3.4s (Production)
- **CLS (Cumulative Layout Shift):** 0.00 (Perfect)
- **TTFB (Time to First Byte):** 3.2s (Serverless cold start)

**Load Performance:**
- Initial page load: ~6 seconds
- 19 strategies loaded from PostgreSQL
- HTTP/2 with Brotli compression
- Netlify Edge CDN caching

**Optimization Notes:**
- Serverless function `maxDuration: 60s` for PostgreSQL cold starts
- Prisma Client singleton pattern prevents connection exhaustion
- ISR (Incremental Static Regeneration) with 1-hour revalidation

### Database Architecture

**Production Database:**
- **Provider:** PostgreSQL (Neon)
- **Connection Pooling:** Prisma singleton pattern
- **URL:** `DATABASE_URL` environment variable
- **Schema:** 19 active strategies, ~10,000 transactions

**Connection Management:**
```typescript
// lib/data/prisma.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: { db: { url: process.env.DATABASE_URL } }
})
```

**Key Features:**
- Singleton pattern prevents connection exhaustion
- Automatic reconnection on serverless cold starts
- Graceful error handling with detailed logging
- Health check endpoint for monitoring

### Monitoring Commands

```bash
# Check production status
curl -I https://deusquant.com/dashboard

# Test health endpoint
curl https://deusquant.com/api/health | jq .

# Verify database connection
curl https://deusquant.com/api/health | jq '.database.status'

# Check active strategies count
curl https://deusquant.com/api/health | jq '.database.activeStrategies'
```

### Deployment

**Platform:** Netlify
**Build Command:** `npm run build`
**Deploy Trigger:** Push to `main` branch

**Environment Variables (Netlify):**
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NODE_VERSION="20"
NPM_FLAGS="--legacy-peer-deps"
```

**Build Configuration:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Automatic Deploys:**
- Push to `main` → Production deploy
- Build time: ~2-3 minutes
- Automatic cache invalidation
- Zero-downtime deployments

### Recent Fixes (Oct 28, 2025)

**Critical Issues Resolved:**
1. ✅ "Connection closed" error eliminated
2. ✅ PostgreSQL connection pooling implemented
3. ✅ Increased serverless timeout (30s → 60s)
4. ✅ Added health check endpoint
5. ✅ Error handling and retry logic
6. ✅ Type safety improvements

**Commits:**
- `0701a00` - Fix PostgreSQL connection pooling for serverless
- `4700c45` - Add health check endpoint with database monitoring

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
