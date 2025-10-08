import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: {
    default: 'CRM PMK - Lead Generation & Management System',
    template: '%s | CRM PMK'
  },
  description: 'Professional CRM system for lead generation, management, and customer relationship management. Track leads, manage groups, and boost your business growth.',
  keywords: ['CRM', 'Lead Management', 'Customer Relationship Management', 'Business Growth', 'Lead Generation'],
  authors: [{ name: 'CRM PMK Team' }],
  creator: 'CRM PMK',
  publisher: 'CRM PMK',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://crm-pmk.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crm-pmk.com',
    title: 'CRM PMK - Lead Generation & Management System',
    description: 'Professional CRM system for lead generation, management, and customer relationship management.',
    siteName: 'CRM PMK',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CRM PMK Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM PMK - Lead Generation & Management System',
    description: 'Professional CRM system for lead generation, management, and customer relationship management.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
