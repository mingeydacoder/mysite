// app/layout.tsx
import './globals.css'
import ContactHover from '../components/ContactHover' // 路徑依你專案調整
import FadeIn from '../components/FadeIn'


import type { ReactNode } from 'react'

export const metadata = {
  title: "Mingey's Website",
  description: 'Next.js + Supabase 個人主頁',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
          style={{
          backgroundImage: "url('/background.jpg')",  // 👈 這裡換圖片路徑
          backgroundSize: 'cover',                    // 圖片填滿畫面
          backgroundRepeat: 'no-repeat',              // 不重複
          backgroundAttachment: 'fixed',              // 捲動時固定
          backgroundPosition: 'center',               // 置中
        }}>
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
        <div className="relative z-10"></div>
        
        <FadeIn className="fade-left">
                  <header className="dynamic-bg border-b text-white">
          <div className="container flex items-center justify-between h-16">
            <a className="text-lg font-semibold text-black" href="/">🤗 Mingey's Website 🤗</a>
            <nav className="flex items-center gap-3"></nav>
          </div>
        </header>

        </FadeIn>



        <div className="container py-5">
          {/* 把元件放在最外層（fixed 絕對定位於視窗右上） */}
          <ContactHover />
        </div>

        <main className="container py-10">{children}</main>

        <footer className="mt-12">
          <div className="container py-6 text-center text-sm text-muted">
            © {new Date().getFullYear()} Allen Chen. All rights reserved.
          </div>
        </footer>

        
      </body>
      
    </html>
  )
}
