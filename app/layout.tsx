import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Montserrat, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'

const siteUrl = 'https://deusquant.com'
const siteName = 'Deus Quant'
const siteDescription =
  'Algorithmic trading strategy portfolio with MetaTrader 5 backtests, forward-test monitoring, equity curves, drawdown analysis and Quant R&D automation.'

// Optimized font loading with preload
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // Less critical, optional loading
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: 'Deus Quant | Algorithmic Trading Strategy Portfolio',
    template: '%s | Deus Quant',
  },
  description: siteDescription,
  authors: [{ name: 'Deus Quant', url: siteUrl }],
  creator: 'Deus Quant',
  publisher: 'Deus Quant',
  category: 'Finance',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    siteName,
    title: 'Deus Quant | Algorithmic Trading Strategy Portfolio',
    description: siteDescription,
    url: siteUrl,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/logo-sun-white.jpg',
        width: 800,
        height: 600,
        alt: 'Deus Quant algorithmic trading strategy portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deus Quant | Algorithmic Trading Strategy Portfolio',
    description: siteDescription,
    images: ['/images/logo-sun-white.jpg'],
  },
  alternates: {
    canonical: '/dashboard',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased bg-bg-primary text-text-primary" suppressHydrationWarning>

        {/* JSON-LD: Organization Schema */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': `${siteUrl}/#organization`,
              name: siteName,
              url: `${siteUrl}/`,
              logo: `${siteUrl}/images/logo-sun-white.jpg`,
              description: siteDescription,
              knowsAbout: [
                'Algorithmic trading strategy research',
                'MetaTrader 5 backtesting',
                'MQL5 strategy development',
                'Forward-test monitoring',
                'Equity curve analysis',
                'Drawdown analysis',
                'Quantitative trading automation',
              ],
            }),
          }}
        />

        {/* JSON-LD: WebSite Schema */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              name: siteName,
              url: `${siteUrl}/`,
              description: siteDescription,
              publisher: {
                '@id': `${siteUrl}/#organization`,
              },
            }),
          }}
        />

        {children}
      </body>
    </html>
  )
}
