'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const session = supabase.auth.session?.() ?? null
    setUser(session?.user ?? null)

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetchPosts()

    return () => {
      listener?.unsubscribe?.()
    }
  }, [])

  async function signUpOrSignIn(email: string) {
    await supabase.auth.signIn({ email })
    alert('已發送登入連結到你的信箱（magic link）')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setPosts(data || [])
  }

  async function createPost(e: FormEvent) {
    e.preventDefault()
    if (!user) return alert('請先登入')
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
            <li key={p.id}>
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
