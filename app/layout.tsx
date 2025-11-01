// app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: '我的小站',
  description: 'Next.js + Supabase 個人小站',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <header className="bg-white border-b">
          <div className="container flex items-center justify-between h-16">
            <a className="text-lg font-semibold text-primary" href="/">MySite</a>
            <nav className="flex items-center gap-3">
              <a className="text-sm text-muted hover:text-gray-900" href="#">About</a>
              <a className="text-sm text-muted hover:text-gray-900" href="#">Contact</a>
            </nav>
          </div>
        </header>

        <main className="container py-10">{children}</main>

        <footer className="border-t mt-12">
          <div className="container py-6 text-center text-sm text-muted">
            © {new Date().getFullYear()} MySite — 個人非商業用途
          </div>
        </footer>
      </body>
    </html>
  )
}
