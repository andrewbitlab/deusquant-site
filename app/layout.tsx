import type { Metadata } from 'next'
import { Inter, Montserrat, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Deus Quant',
  description: 'Quantitative Trading & Portfolio Management',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  openGraph: {
    siteName: 'Deus Quant',
    title: 'Deus Quant',
    description: 'Quantitative Trading & Portfolio Management',
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
    description: 'Quantitative Trading & Portfolio Management',
    images: ['https://deusquant.com/images/logo.png'],
  },
  alternates: {
    canonical: 'https://deusquant.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased bg-bg-primary text-text-primary">
        {children}
      </body>
    </html>
  )
}
