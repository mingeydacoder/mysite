'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '../lib/supabaseClient'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: { display_name?: string }  // supabase join result
}

export default function HomePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<{ display_name?: string } | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    const sb = createBrowserSupabaseClient()
    if (!sb) return
    setSupabase(sb)

    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null)).catch(console.error)

    const { data: subscriptionData } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfileAndPosts(sb, session.user.id)
      else {
        setProfile(null)
        setPosts([])
      }
    })

    // initial fetch (if already logged in)
    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id
      if (uid) fetchProfileAndPosts(sb, uid)
    }).catch(console.error)

    return () => subscriptionData?.subscription?.unsubscribe?.()
  }, [])

async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
  setUser(null)
  setProfile(null)
  setPosts([])
}

  // fetch profile and posts (join profiles)
// 把這個函式貼到你的檔案，替換掉原本使用 nested select 的 fetchProfileAndPosts / fetchPosts
async function fetchProfileAndPosts(sb: SupabaseClient, uid: string) {
  // 1) 先抓 posts（單表）
  const { data: postsData, error: postsErr } = await sb
    .from('posts')
    .select('id, content, created_at, user_id')
    .order('created_at', { ascending: false })

  if (postsErr) {
    console.error('fetch posts error', postsErr)
    setPosts([]) // 保險起見清空
    return
  }

  const posts = (postsData as Post[]) || []

  // 2) 取出所有不重複的 user_id
  const userIds = Array.from(new Set(posts.map(p => p.user_id).filter(Boolean)))

  // 如果沒有 userIds，直接設定 posts
  if (userIds.length === 0) {
    setPosts(posts)
    return
  }

  // 3) 批次抓 profiles（一次請求）
  const { data: profilesData, error: profilesErr } = await sb
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds)

  if (profilesErr) {
    console.error('fetch profiles error', profilesErr)
    // 即使 profiles 錯誤，也先把 posts 顯示（顯示匿名）
    const postsWithAnon = posts.map(p => ({ ...p, profiles: { display_name: undefined } }))
    setPosts(postsWithAnon)
    return
  }

  const profiles = (profilesData ?? []) as { user_id: string; display_name?: string }[]

  // 4) 建 Map 方便 lookup
  const nameById = new Map<string, string | undefined>()
  for (const pr of profiles) {
    nameById.set(pr.user_id, pr.display_name)
  }

  // 5) 把 display_name 對應回 posts
  const postsWithProfiles = posts.map(p => ({
    ...p,
    profiles: { display_name: nameById.get(p.user_id) ?? undefined },
  }))

  setPosts(postsWithProfiles)
}


  // upsert (insert or update) profile
  async function saveDisplayName(e?: FormEvent) {
    if (e) e.preventDefault()
    if (!supabase || !user) return alert('請先登入')
    const uid = user.id
    const display_name = nameInput.trim()
    if (!display_name) return alert('請輸入名稱')

    setIsSavingName(true)
    // use upsert to insert or update
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: uid, display_name, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setIsSavingName(false)
    if (error) {
      console.error('save profile error', error)
      alert('儲存名稱失敗')
    } else {
      setProfile({ display_name })
      // refresh posts to get display_name in list if using join
      fetchProfileAndPosts(supabase, uid)
    }
  }

  // create post (uses user.id)
  async function createPost(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !user) return alert('請先登入')
    const form = e.target as HTMLFormElement
    const content = (form.content as HTMLTextAreaElement).value.trim()
    if (!content) return
    const { error } = await supabase.from('posts').insert({ content, user_id: user.id })
    if (error) console.error('insert post error', error)
    else {
      form.reset()
      fetchProfileAndPosts(supabase, user.id)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-semibold mb-6">我的小站</h1>

      {!user ? (
        <div className="card">
          <p className="mb-3">輸入 Email 登入（magic link）</p>
          <form onSubmit={(e) => { e.preventDefault(); const email = (e.target as HTMLFormElement).email.value; signUpOrSignIn(email) }}>
            <input name="email" type="email" placeholder="you@example.com" className="input mb-3" required />
            <button className="btn btn-primary">發送登入連結</button>
          </form>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="kv">已登入</div>
                <div className="font-medium">{profile?.display_name ?? user.email}</div>
              </div>
              <div>
                <button className="btn btn-ghost mr-2" onClick={() => setNameInput(profile?.display_name ?? '')}>編輯名稱</button>
                <button className="btn btn-ghost" onClick={signOut}>登出</button>
              </div>
            </div>

            {/* 如果沒有 display_name，顯示填寫表單 */}
            {!profile?.display_name && (
              <form onSubmit={saveDisplayName} className="space-y-3">
                <label className="block text-sm kv">設定顯示名稱（其他人看到的名稱）</label>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} name="display_name" className="input" placeholder="輸入你的名稱" />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isSavingName}>
                    {isSavingName ? '儲存中...' : '儲存名稱'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setNameInput('')}>取消</button>
                </div>
              </form>
            )}
          </div>

          {/* 發文表單 */}
          <div className="card mb-6">
            <form onSubmit={createPost}>
              <textarea name="content" className="input mb-3" rows={4} placeholder="寫點什麼..." />
              <button type="submit" className="btn btn-primary w-full">發佈</button>
            </form>
          </div>

          {/* 貼文清單 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">貼文</h2>
            {posts.length === 0 ? <p className="kv">目前沒有貼文</p> : (
              <ul className="space-y-4">
                {posts.map(p => (
                  <li key={p.id} className="post-item">
                    <div className="meta">{new Date(p.created_at).toLocaleString()}</div>
                    <div className="font-medium">{p.profiles?.display_name ?? '匿名'}</div>
                    <div className="mt-2">{p.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
