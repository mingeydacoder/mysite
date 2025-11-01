// components/ContactHover.tsx
'use client'

import { useState, useRef } from 'react'

interface Props {
  content?: React.ReactNode
  top?: number // px offset from top
  right?: number // px offset from right
}

export default function ContactHover({ content, top = 16, right = 16 }: Props) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  function show() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setOpen(true)
  }
  function hide() {
    // small delay to make hover feel better
    timeoutRef.current = window.setTimeout(() => setOpen(false), 120)
  }
  function cancelHide() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  return (
    // container is fixed in viewport top-right
    <div style={{ top: top, right: right }} className="fixed z-50">
      <div
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="relative"
      >
        {/* 按鈕 */}
        <button
          aria-haspopup="dialog"
          aria-expanded={open}
          className="btn btn-ghost px-3 py-2 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          ☎️ Contact 
        </button>

        {/* 浮動視窗 */}
        <div
          onMouseEnter={cancelHide}
          onMouseLeave={hide}
          role="dialog"
          aria-hidden={!open}
          className={`pointer-events-none transform transition-all duration-150 ease-out origin-top-right ${
            open ? 'opacity-100 translate-y-1 pointer-events-auto' : 'opacity-0 -translate-y-1'
          }`}
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 8,
            minWidth: 250,
            zIndex: 60,
          }}
        >
          <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-4 text-sm text-gray-800">
            {/* 小箭頭 */}
            <div style={{ position: 'absolute', right: 12, top: -6, width: 12, height: 6, overflow: 'hidden' }}>
              <svg width="24" height="12" viewBox="0 0 24 12" className="block">
                <path d="M12 0 L24 12 H0 Z" fill="white" stroke="rgba(0,0,0,0.06)" />
              </svg>
            </div>

            {/* 內容（可自訂） */}
            <div>
              {content ?? (
                <>
                  <div className="font-medium text-gray-900 mb-1">聯絡方式</div>
                  <div className="kv mb-1">Email: <a className="text-indigo-600">allenchen0121@gmail.com</a></div>
                  <div className="kv">Line: <a className="text-indigo-600">0970555098</a></div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
