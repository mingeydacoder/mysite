'use client'
import { useEffect, useState, useCallback } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // 初始化（只在 client）
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
      const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      const initial = saved || (prefersDark ? 'dark' : 'light')
      setTheme(initial)
      // 直接同步到 <html>
      if (initial === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (e) {
      // safety
      console.error('useTheme init error', e)
    } finally {
      setMounted(true)
    }
  }, [])

  // 當 theme 變更時同步 class 與 localStorage
  useEffect(() => {
    if (!mounted) return
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('theme', theme)
    } catch (e) {
      console.error('useTheme sync error', e)
    }
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme, mounted }
}
