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

### PHASE 4: Forward Test Integration
1. Create CSV parser for forward tests
2. Implement BacktestForwardMerger class
3. Test merging with sample data
4. Verify date alignment and calculations
5. Commit: "Phase 4: Forward test integration complete"

### PHASE 5: Upload System
1. Create FileUploader component with drag & drop
2. Implement upload API endpoints
3. Add progress indicators and validation
4. Test file uploads end-to-end
5. Commit: "Phase 5: Upload system complete"

### PHASE 6: Dashboard Components
1. Create Logo component with DEUS QUANT branding
2. Build Header and Navigation
3. Implement EquityCurve chart
4. Create StatsPanel with metric cards
5. Test all components render correctly
6. Commit: "Phase 6: Dashboard components complete"

### PHASE 7: Strategy Table & Portfolio
1. Create StrategyTable with sorting/filtering
2. Implement portfolio weight calculations
3. Add real-time portfolio combination
4. Test portfolio calculations
5. Commit: "Phase 7: Portfolio system complete"

### PHASE 8: Advanced Visualizations
1. Create MonthlyHeatmap component
2. Build CorrelationMatrix
3. Implement DrawdownChart
4. Add RiskReturnScatter
5. Test all charts with real data
6. Commit: "Phase 8: Advanced visualizations complete"

### PHASE 9: Export Features
1. Implement PDF generation
2. Add Excel export
3. Create shareable links
4. Test all export formats
5. Commit: "Phase 9: Export features complete"

### PHASE 10: Polish & Optimization
1. Add loading states everywhere
2. Implement error boundaries
3. Optimize performance (memoization, virtualization)
4. Add animations with Framer Motion
5. Final testing of complete system
6. Commit: "Phase 10: System complete and optimized"

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
