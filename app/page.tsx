import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deus Quant',
  description: 'Quantitative Trading & Portfolio Management',
  openGraph: {
    siteName: 'Deus Quant',
    title: 'Deus Quant',
    url: 'https://deusquant.com',
    type: 'website',
    images: [
      {
        url: 'https://deusquant.com/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Deus Quant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deus Quant',
    images: ['https://deusquant.com/images/logo.png'],
  },
  alternates: {
    canonical: 'https://deusquant.com',
  },
}

export default function HomePage() {
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

      <h1 className="sr-only">Deus Quant</h1>
      <main className="h-screen w-screen grid place-items-center bg-white overflow-hidden">
        <Link href="/dashboard" className="block">
          <Image
            src="/images/logo.png"
            alt="Deus Quant"
            width={800}
            height={600}
            className="max-w-[90vw] max-h-[90vh] h-auto hover:opacity-90 transition-opacity cursor-pointer"
            priority
          />
        </Link>
      </main>
    </>
  )
}
