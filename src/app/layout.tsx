import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MedicalGateway — MBBS MCQ Platform',
  description: 'Pakistan\'s best MCQ platform for MBBS students. 25,000+ MCQs across all years and subjects.',
  keywords: 'MBBS MCQs, Pakistan medical students, anatomy MCQs, physiology MCQs, FCPS preparation',
  openGraph: {
    title: 'MedicalGateway',
    description: 'Master your MBBS with 25,000+ expert MCQs',
    url: 'https://medicalgateway.pk',
    siteName: 'MedicalGateway',
    locale: 'en_PK',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'var(--font-inter)', fontSize: '14px' },
            success: { style: { borderLeft: '4px solid #1D7A4A' } },
            error:   { style: { borderLeft: '4px solid #C0392B' } },
          }}
        />
      </body>
    </html>
  )
}
