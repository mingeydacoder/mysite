'use client'

import React, { useEffect, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number // ms, 0 / 75 / 150 / 225 / ...
  once?: boolean // 只在 mount 時播放一次 (default true)
  style?: React.CSSProperties
}

export default function FadeIn({ children, className = '', delay = 0, once = true, style }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 只在 client mount 時觸發動畫
    setMounted(true)
  }, [])

  // map delay (ms) to our helper classes - fallback to inline style delay if not match
  const delayClassMap: Record<number, string> = {
    0: 'fade-delay-0',
    75: 'fade-delay-75',
    150: 'fade-delay-150',
    225: 'fade-delay-225',
    300: 'fade-delay-300',
    375: 'fade-delay-375',
    450: 'fade-delay-450',
  }

  const delayClass = delayClassMap[delay] ?? ''

  // combine classes: 當 mounted 為 true 時加入 .fade-up（觸發動畫）
  const combinedClass = `${mounted ? 'fade-up' : ''} ${delayClass} ${className}`.trim()

  // 若 delay 非內建，使用 inline style 的 animationDelay
  const extraStyle = delayClass ? style : { ...(style ?? {}), animationDelay: `${delay}ms` }

  return (
    <div className={combinedClass} style={extraStyle}>
      {children}
    </div>
  )
}
