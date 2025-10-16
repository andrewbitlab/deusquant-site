import Link from 'next/link'
import Image from 'next/image'
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
