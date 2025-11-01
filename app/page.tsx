'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '../lib/supabaseClient'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
}

export default function HomePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<any>(null)
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    // 只在 client 建立 supabase client
    const sb = createBrowserSupabaseClient()
    if (!sb) {
      console.error('Supabase client not available (missing env?)')
      return
    }
    setSupabase(sb)

    // 取得目前 session（v2）
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    }).catch(console.error)

    const { data: subscriptionData } = sb.auth.onAuthStateChange((_event, authSession) => {
      setUser(authSession?.user ?? null)
    })

    // initial fetch
    fetchPosts(sb)

    return () => {
      subscriptionData?.subscription?.unsubscribe?.()
    }
  }, [])

  // fetchPosts using a supabase client instance
  async function fetchPosts(client?: SupabaseClient) {
    const sb = client ?? supabase
    if (!sb) return
    const { data, error } = await sb
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setPosts((data as Post[]) || [])
  }

  async function signUpOrSignIn(email: string) {
    if (!supabase) return alert('Supabase client not ready')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) console.error(error)
    else alert('已發送登入連結到你的信箱（magic link）')
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  async function createPost(e: FormEvent) {
    e.preventDefault()
    if (!user) return alert('請先登入')
    if (!supabase) return alert('Supabase client not ready')
    const { error } = await supabase.from('posts').insert({ content, user_id: user.id })
    if (error) console.error(error)
    else {
      setContent('')
      fetchPosts()
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>我的小站（App Router / TypeScript）</h1>

      {!user ? (
        <div>
          <p>輸入 Email（magic link）登入：</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const email = (e.target as HTMLFormElement).email.value
              signUpOrSignIn(email)
            }}
          >
            <input name="email" type="email" placeholder="you@example.com" required />
            <button type="submit">送出登入連結</button>
          </form>
        </div>
      ) : (
        <div>
          <p>
            已登入：{user.email} <button onClick={signOut}>登出</button>
          </p>
          <form onSubmit={createPost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="寫點什麼..."
              required
            />
            <br />
            <button type="submit">發佈</button>
          </form>
        </div>
      )}

      <hr />
      <h2>貼文清單</h2>
      {posts.length === 0 ? (
        <p>目前沒有貼文</p>
      ) : (
        <ul>
          {posts.map((p) => (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>
                {new Date(p.created_at).toLocaleString()}
              </div>
              <div>{p.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
