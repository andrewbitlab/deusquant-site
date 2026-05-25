import type { MetadataRoute } from 'next'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const baseUrl = 'https://deusquant.com'

function getStrategyIds() {
  const reportsDir = join(process.cwd(), 'data', 'backtest', 'html')

  if (!existsSync(reportsDir)) {
    return []
  }

  return readdirSync(reportsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d+\.html$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.html$/, ''))
    .sort((a, b) => Number(a) - Number(b))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const strategyIds = getStrategyIds()

  return [
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...strategyIds.flatMap((id) => [
      {
        url: `${baseUrl}/dashboard/strategy/${id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/dashboard/backtest/${id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ]),
  ]
}
