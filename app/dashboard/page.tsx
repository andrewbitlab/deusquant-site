import Script from 'next/script'
import { DashboardHeader } from '@/components/dashboard/Header'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getAllStrategies } from '@/lib/data/loader'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Load all strategies from data directory
  const strategies = await getAllStrategies()

  return (
    <>
      {/* JSON-LD: Organization Schema */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Deus Quant',
            url: 'https://deusquant.com/',
            logo: 'https://deusquant.com/images/logo.png',
            sameAs: [
              'https://github.com/deusquant',
              'https://www.linkedin.com/company/deus-quant',
              'https://x.com/deusquant',
            ],
          }),
        }}
      />

      {/* JSON-LD: WebSite Schema with SearchAction */}
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Deus Quant',
            url: 'https://deusquant.com/',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://deusquant.com/?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <h1 className="sr-only">Deus Quant Portfolio Dashboard</h1>

      <div className="min-h-screen bg-bg-secondary">
        <DashboardHeader />

        <div className="container mx-auto px-6 py-8">
          <DashboardClient strategies={strategies} />
        </div>
      </div>
    </>
  )
}
