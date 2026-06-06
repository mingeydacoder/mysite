// components/ContactHover.tsx
'use client'

import { useState, useRef } from 'react'
import type { CSSProperties } from 'react'

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
    <div
      style={{ '--contact-top': `${top}px`, '--contact-right': `${right}px` } as CSSProperties & Record<string, string>}
      className="contact-float fixed z-50"
    >
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
          onClick={() => setOpen(value => !value)}
          className="btn btn-ghost px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          ☎️ Contact 
        </button>

        {/* 浮動視窗 */}
        <div
          onMouseEnter={cancelHide}
          onMouseLeave={hide}
          role="dialog"
          aria-hidden={!open}
          className={`contact-popover ${open ? 'contact-popover-open' : ''}`}
        >
          <div className="modal-panel w-auto min-w-0 overflow-visible p-4 text-sm">
            {/* 內容（可自訂） */}
            <div>
              {content ?? (
                <>
                  <div className="font-medium mb-1">聯絡方式</div>
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
