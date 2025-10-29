import { prisma } from '../client'
import type { Portfolio, PortfolioStrategy } from '@prisma/client'

export async function getAllPortfolios() {
  return prisma.portfolio.findMany({
    include: {
      PortfolioStrategy: {
        include: {
          Strategy: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPortfolioById(id: string) {
  return prisma.portfolio.findUnique({
    where: { id },
    include: {
      PortfolioStrategy: {
        where: { enabled: true },
        include: {
          Strategy: {
            include: {
              Transaction: true,
            },
          },
        },
      },
    },
  })
}

export async function createPortfolio(
  data: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt' | 'lastCalculated'>
) {
  return prisma.portfolio.create({
    data: {
      ...data,
      id: `portfolio-${Date.now()}`,
      updatedAt: new Date(),
    },
  })
}

export async function addStrategyToPortfolio(
  portfolioId: string,
  strategyId: string,
  weight: number
) {
  return prisma.portfolioStrategy.create({
    data: {
      id: `ps-${portfolioId}-${strategyId}-${Date.now()}`,
      portfolioId,
      strategyId,
      weight,
    },
  })
}

export async function updatePortfolioStrategy(
  id: string,
  data: Partial<PortfolioStrategy>
) {
  return prisma.portfolioStrategy.update({
    where: { id },
    data,
  })
}

export async function removeStrategyFromPortfolio(id: string) {
  return prisma.portfolioStrategy.delete({
    where: { id },
  })
}
