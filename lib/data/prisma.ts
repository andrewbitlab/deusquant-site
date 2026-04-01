import { Prisma, PrismaClient } from '@prisma/client'

const databaseUrl = process.env.DATABASE_URL?.trim()

// PrismaClient singleton for connection pooling
// Prevents "too many connections" errors in serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
}

if (databaseUrl) {
  prismaClientOptions.datasources = {
    db: {
      url: databaseUrl,
    },
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl)
}

// In development, preserve the Prisma client across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown handler
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
