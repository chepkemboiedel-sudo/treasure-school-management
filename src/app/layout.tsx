import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SessionProvider from '@/components/layout/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'The Treasure School',
  description: 'School Management System — The Treasure School',
  icons: { icon: '/images/logo.svg' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '8px', fontSize: '14px' },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
