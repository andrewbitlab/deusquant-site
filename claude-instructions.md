# AUTOMATED BUILD INSTRUCTIONS FOR CLAUDE CODE

You are building the DEUS QUANT Portfolio System. Follow the documentation in `docs/portfolio-system-docs.md` EXACTLY.

## BUILD SEQUENCE:

### PHASE 1: Project Initialization
1. Create Next.js 14 project with TypeScript and Tailwind
2. Install ALL dependencies from the documentation
3. Set up project structure as specified
4. Create DEUS QUANT theme configuration
5. Test: Run `npm run dev` and verify it starts
6. Commit: "Phase 1: Project initialization complete"

### PHASE 2: Database & Core Setup  
1. Configure Prisma with SQLite for development
2. Create complete schema from documentation
3. Run migrations: `npx prisma migrate dev --name init`
4. Create database client singleton
5. Test: Verify Prisma Studio works
6. Commit: "Phase 2: Database setup complete"

### PHASE 3: MT5 Parser Implementation
1. Create MT5 HTML parser following the specification
2. Create Excel parser as fallback
3. Implement comprehensive error handling
4. Test with file: `data/backtest/202501027.xlsx`
5. Verify all metrics are extracted correctly
6. Commit: "Phase 3: MT5 parsers complete"

### PHASE 4: Dashboard Components & Data Loader
1. Create `lib/data/loader.ts` to load strategies from `data/` directory
2. Create Logo component with DEUS QUANT branding
3. Build Header with time display
4. Implement EquityCurve chart
5. Create StatsPanel with metric cards
6. Update dashboard page to use loader (server component)
7. Test all components render with data from files
8. Commit: "Phase 4: Dashboard components and data loader complete"

### PHASE 5: Upload Page Implementation
1. Create `/upload` page with file upload interface
2. Implement drag & drop uploader for .xlsx (backtest) and .csv (forward) files
3. Create server actions in `app/api/upload/backtest/route.ts` and `/forward/route.ts`
4. Server action saves files to `data/backtest/` or `data/forward/` directories
5. Add file validation (type, size, name format)
6. Implement success/error notifications with toast
7. Show list of recently uploaded files
8. Test complete upload flow for both file types
9. Commit: "Phase 5: Upload page complete"

### PHASE 6: Dashboard Refresh Feature
1. Update `components/dashboard/Header.tsx` with functional "Refresh" button
2. Add loading state with spinning icon during refresh
3. Implement refresh handler that calls `/api/strategies/load`
4. Dashboard updates to client component or uses router.refresh()
5. Add toast notifications for refresh success/error
6. Update "Last Update" timestamp on successful refresh
7. Test complete flow: upload file → navigate to dashboard → click refresh → see new data
8. Commit: "Phase 6: Dashboard refresh feature complete"

### PHASE 7: Strategy Table & Portfolio
1. Create StrategyTable with sorting/filtering
2. Implement portfolio weight calculations
3. Add real-time portfolio combination
4. Test portfolio calculations
5. Commit: "Phase 7: Portfolio system complete"

### PHASE 8: Forward Test Integration
1. Create CSV parser for forward tests
2. Implement BacktestForwardMerger class
3. Update loader to merge backtest and forward data
4. Test merging with sample data from `data/forward/`
5. Verify date alignment and calculations
6. Commit: "Phase 8: Forward test integration complete"

### PHASE 9: Advanced Visualizations
1. Create MonthlyHeatmap component
2. Build CorrelationMatrix
3. Implement DrawdownChart
4. Add RiskReturnScatter
5. Test all charts with real data
6. Commit: "Phase 9: Advanced visualizations complete"

### PHASE 10: Export Features & Polish
1. Implement PDF report generation
2. Add Excel export functionality
3. Add loading states everywhere
4. Implement error boundaries
5. Optimize performance (memoization, virtualization)
6. Add animations with Framer Motion
7. Final testing of complete system
8. Commit: "Phase 10: System complete and optimized"

## TESTING REQUIREMENTS:
- After EACH phase, run the app and verify functionality
- Use the test data in `data/` folder
- Ensure no TypeScript errors: `npm run build`
- Check for console errors in browser

## IMPORTANT NOTES:
- Use EXACT package versions from documentation
- Follow DEUS QUANT brand guidelines (white/gray theme)
- Magic Number 202501027 is in test data - verify it parses
- Initial capital should normalize to $1000
- All monetary values in USD

## QUALITY CHECKS:
- ✅ No TypeScript errors
- ✅ All imports resolved
- ✅ Database migrations successful
- ✅ Charts render with test data
- ✅ Portfolio calculations accurate
- ✅ Responsive design works
- ✅ Loading states present
- ✅ Error handling comprehensive

Start with PHASE 1 now. After each phase, test thoroughly before committing.
