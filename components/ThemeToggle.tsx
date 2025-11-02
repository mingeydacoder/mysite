'use client'

import React from 'react'
import { useTheme } from '../app/hooks/useTheme'

// 如果沒安裝 lucide-react，下面註解圖示改用 emoji 即可
// import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  // 若尚未 mount，回傳固定大小的佔位，避免 hydration mismatch
  if (!mounted) {
    return <div className="w-10 h-10" aria-hidden />
  }

  return (
    <button
    onClick={toggleTheme}
    aria-label="切換主題"
    className="
    fixed bottom-6 right-6 z-50
    p-3 rounded-full
    backdrop-blur-md
    bg-white/70 dark:bg-gray-800/70
    border border-gray-300 dark:border-gray-700
    shadow-lg hover:shadow-2xl
    hover:scale-102 /* 小幅度放大，不會把游標移出 */
    transform-gpu
    transition-shadow transition-transform duration-300 ease-in-out
    "
    style={{ transformOrigin: 'center' }}

    >
    {theme === 'light' ? '🌙' : '☀️'}
    </button>

  )
}
