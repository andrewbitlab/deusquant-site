#!/usr/bin/env node

const isNetlify = process.env.NETLIFY === 'true'
const context = process.env.CONTEXT ?? ''
const isProductionContext = context === 'production'
const databaseUrl = process.env.DATABASE_URL?.trim()

if (!isNetlify || !isProductionContext) {
  process.exit(0)
}

if (!databaseUrl) {
  console.error('')
  console.error('[prebuild-check] Missing required DATABASE_URL for Netlify production deploy.')
  console.error('[prebuild-check] Add it in Netlify: Site configuration -> Environment variables.')
  console.error('')
  process.exit(1)
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('')
  console.error('[prebuild-check] DATABASE_URL must use a PostgreSQL connection string.')
  console.error(`[prebuild-check] Current value starts with: ${databaseUrl.slice(0, 24)}...`)
  console.error('')
  process.exit(1)
}

console.log(`[prebuild-check] DATABASE_URL present for Netlify ${context} deploy.`)
