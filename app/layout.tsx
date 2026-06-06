// app/layout.tsx
import './globals.css'
import Link from 'next/link'
import ContactHover from '../components/ContactHover'
import ThemeToggle from '../components/ThemeToggle'




import type { ReactNode } from 'react'

export const metadata = {
  title: "Mingey's Website",
  description: 'Next.js + Supabase 個人主頁',
}



export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="site-bg">
        <ThemeToggle />

        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

        <header className="site-header dynamic-bg">
          <div className="container flex min-h-16 flex-col justify-center gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
            <Link className="site-brand" href="/">Mingey&apos;s Website</Link>
            <nav className="site-nav" aria-label="主要導覽">
              <Link href="/#about">關於</Link>
              <Link href="/#community">社群</Link>
              <Link href="/#community">貼文</Link>
              <Link href="/favorites">收藏</Link>
            </nav>
          </div>
        </header>

        <div className="container py-5">
          <ContactHover top={80} />
        </div>

        <main className="container py-6 sm:py-10">{children}</main>

        <footer className="mt-12">
          <div className="container py-6 text-center text-sm text-muted">
            © {new Date().getFullYear()} Allen Chen. All rights reserved.
          </div>
        </footer>

      </body>
    </html>
  )
}
