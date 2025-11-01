// app/layout.tsx
import './globals.css'
import ContactHover from '../components/ContactHover' // 路徑依你專案調整

import type { ReactNode } from 'react'

export const metadata = {
  title: "Mingey's Website",
  description: 'Next.js + Supabase 個人小站',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <header className="dynamic-bg border-b text-white">
          <div className="container flex items-center justify-between h-16">
            <a className="text-lg font-semibold text-black" href="/">🤗 Mingey's Website 🤗</a>
            <nav className="flex items-center gap-3"></nav>
          </div>
        </header>


        <div className="container py-5">
          {/* 把元件放在最外層（fixed 絕對定位於視窗右上） */}
          <ContactHover />
        </div>

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
