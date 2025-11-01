// app/favorites/page.tsx
'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '../../lib/supabaseClient'


interface Favorite {
  id: string
  user_id: string
  title: string
  url?: string | null
  created_at?: string | null
}

export default function FavoritesPage() {
  const [sb, setSb] = useState<SupabaseClient | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

    useEffect(() => {
    const client = createBrowserSupabaseClient()
    // 如果 createBrowserSupabaseClient 可能回傳 null，要在這裡處理掉
    if (!client) {
        console.error('Supabase client not initialized')
        setSb(null)
        setLoading(false)
        return
    }

    setSb(client)

    client.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id ?? null
        setUserId(uid)
        if (uid) fetchFavorites(client, uid)
        else setLoading(false)
    }).catch(err => {
        console.error('getSession error', err)
        setLoading(false)
    })

    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
        const uid = session?.user?.id ?? null
        setUserId(uid)
        if (uid) fetchFavorites(client, uid)
        else setFavorites([])
    })

    return () => sub?.subscription?.unsubscribe?.()
    }, [])



  async function fetchFavorites(supabase: SupabaseClient, uid: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, user_id, title, url, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('fetch favorites error', error)
        setFavorites([])
      } else {
        setFavorites((data ?? []) as Favorite[])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!sb) return alert('Supabase client not ready')
    if (!userId) return alert('請先登入')

    const title = newTitle.trim()
    const url = newUrl.trim() || null
    if (!title) return alert('請輸入標題')

    setAdding(true)
    try {
      const { data, error } = await sb.from('favorites').insert([{ user_id: userId, title, url }]).select().single()
      if (error) {
        console.error('insert favorite error', error)
        alert('新增失敗')
      } else {
        // 將新項目放到最前面
        setFavorites(prev => [data as Favorite, ...prev])
        setNewTitle('')
        setNewUrl('')
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!sb) return
    if (!userId) return alert('請先登入')
    if (!confirm('確定要刪除此收藏？')) return

    try {
      const { error } = await sb.from('favorites').delete().match({ id, user_id: userId })
      if (error) {
        console.error('delete favorite error', error)
        alert('刪除失敗')
      } else {
        setFavorites(prev => prev.filter(f => f.id !== id))
      }
    } catch (err) {
      console.error(err)
      alert('刪除時發生錯誤')
    }
  }

  if (!userId) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">我的收藏</h1>
          <Link href="/" className="btn btn-ghost">回到首頁</Link>
        </div>
        <div className="card">
          <p>請先登入以使用收藏功能。</p>
          <Link href="/" className="btn btn-primary mt-3">回到首頁 / 登入</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-20">
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">我的收藏</h1>
        <Link href="/" className="btn btn-ghost">回到首頁</Link>
      </div>

    <div className="card mb-6">
    <form onSubmit={handleAdd}>
        <div className="flex flex-wrap gap-2 items-center">
        {/* 標題輸入框（主要欄位，較寬） */}
        <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input flex-[0_7_0%] min-w-[180px]"
            placeholder="收藏標題（必填）"
            required
        />

        {/* 網址輸入框（次要欄位，略窄） */}
        <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="input flex-[1_1_0%] min-w-[150px]"
            placeholder="網址（可選）"
        />

        {/* 新增按鈕 */}
        <button
            type="submit"
            className="btn btn-primary px-5"
            disabled={adding}
        >
            {adding ? '新增中…' : '新增'}
        </button>
        </div>
    </form>
    </div>


      {loading ? (
        <div className="card">載入中…</div>
      ) : favorites.length === 0 ? (
        <div className="card">目前沒有收藏（可使用上方表單新增）</div>
      ) : (
        <div className="space-y-3">
          {favorites.map(f => (
            <div key={f.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{f.title}</div>
                {f.url && (
                  <a href={f.url} target="_blank" rel="noopener" className="kv">
                    {f.url}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="kv text-sm">{f.created_at ? new Date(f.created_at).toLocaleString() : ''}</div>
                <button className="btn btn-ghost" onClick={() => handleDelete(f.id)}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
