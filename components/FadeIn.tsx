'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number // ms, 0 / 75 / 150 / 225 / ...
  once?: boolean // 保留相容既有呼叫
  style?: React.CSSProperties
}

export default function FadeIn({ children, className = '', delay = 0, style }: Props) {
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

  const combinedClass = `fade-up ${delayClass} ${className}`.trim()

  // 若 delay 非內建，使用 inline style 的 animationDelay
  const extraStyle = delayClass ? style : { ...(style ?? {}), animationDelay: `${delay}ms` }

  return (
    <div className={combinedClass} style={extraStyle}>
      {children}
    </div>
  )
}
