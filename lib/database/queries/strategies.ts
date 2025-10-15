import { prisma } from '../client'
import type { Strategy, Transaction } from '@prisma/client'

export async function getAllStrategies() {
  return prisma.strategy.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getStrategyByMagicNumber(magicNumber: number) {
  return prisma.strategy.findUnique({
    where: { magicNumber },
    include: {
      transactions: {
        orderBy: { openTime: 'asc' },
      },
    },
  })
}

export async function createStrategy(data: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>) {
  return prisma.strategy.create({
    data,
  })
}

export async function updateStrategy(id: string, data: Partial<Strategy>) {
  return prisma.strategy.update({
    where: { id },
    data,
  })
}

export async function deleteStrategy(id: string) {
  return prisma.strategy.update({
    where: { id },
    data: { isActive: false },
  })
}

export async function getStrategyTransactions(strategyId: string) {
  return prisma.transaction.findMany({
    where: { strategyId },
    orderBy: { openTime: 'asc' },
  })
}
