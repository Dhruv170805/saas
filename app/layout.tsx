import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './theme.css'
import { Toaster } from 'sonner'
import { SWRProvider } from '@/components/ui/SWRProvider'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#d97706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'NEXUS | Next-Gen Restaurant OS',
  description: 'The ultimate command center for modern restaurant management. Zero-latency, multi-tenant, and AI-powered.',
  manifest: '/manifest.json',
  icons: { apple: '/icon-192x192.png' },
  openGraph: {
    title: 'NEXUS | Next-Gen Restaurant OS',
    description: 'High-fidelity restaurant management at the edge.',
    url: 'https://nexuspos.local',
    siteName: 'NEXUS',
    locale: 'en_US',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = 'system'

  return (
    <html lang="en" data-theme={theme === 'system' ? undefined : theme} suppressHydrationWarning>
      <head>
        {theme === 'system' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);})();`,
            }}
          />
        )}
      </head>
      <body className={inter.className}>
        <SWRProvider>
          {children}
          
          <Toaster
            position="top-center"
            duration={2000}
            visibleToasts={1}
            toastOptions={{
              style: {
                background: 'rgba(20, 20, 40, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f0f0f8',
                borderRadius: '12px',
              },
            }}
          />
        </SWRProvider>
      </body>
    </html>
  )
}
