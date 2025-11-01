// app/page.tsx
'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '../lib/supabaseClient'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: { display_name?: string }
}

export default function HomePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<{ display_name?: string } | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)

  useEffect(() => {
    const sb = createBrowserSupabaseClient()
    if (!sb) return
    setSupabase(sb)

    // get initial session
    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id
      setUser(data.session?.user ?? null)
      if (uid) fetchProfileAndPosts(sb, uid)
    }).catch(console.error)

    // listen auth changes
    const { data: subscriptionData } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.id) fetchProfileAndPosts(sb, session.user.id)
      else {
        setProfile(null)
        setPosts([])
      }
    })

    return () => subscriptionData?.subscription?.unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- auth helpers ----------
  async function signUpOrSignIn(email: string) {
    if (!supabase) return alert('Supabase client not ready')
    try {
      setIsSendingLink(true)
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        console.error('sign in error', error)
        alert('發送登入連結失敗')
      } else {
        alert('已發送登入連結到你的信箱（請檢查收件匣）')
      }
    } finally {
      setIsSendingLink(false)
    }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setPosts([])
  }

  // ---------- fetch posts & profiles (robust) ----------
  async function fetchProfileAndPosts(sb: SupabaseClient, uid: string) {
    // fetch posts
    const { data: postsData, error: postsErr } = await sb
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })

    if (postsErr) {
      console.error('fetch posts error', postsErr)
      setPosts([])
      return
    }

    const postsList = (postsData as Post[]) || []
    const userIds = Array.from(new Set(postsList.map(p => p.user_id).filter(Boolean)))

    // fetch profiles in batch
    if (userIds.length === 0) {
      setPosts(postsList)
    } else {
      const { data: profilesData, error: profilesErr } = await sb
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      if (profilesErr) {
        console.error('fetch profiles error', profilesErr)
        // still show posts, but without names
        setPosts(postsList.map(p => ({ ...p, profiles: { display_name: undefined } })))
      } else {
        const profiles = (profilesData ?? []) as { user_id: string; display_name?: string }[]
        const nameById = new Map<string, string | undefined>()
        for (const pr of profiles) nameById.set(pr.user_id, pr.display_name)

        const postsWithProfiles = postsList.map(p => ({
          ...p,
          profiles: { display_name: nameById.get(p.user_id) ?? undefined },
        }))
        setPosts(postsWithProfiles)
      }
    }

    // fetch current user's profile (if uid matches)
    const { data: myProfile } = await sb.from('profiles').select('display_name').eq('user_id', uid).maybeSingle()
    setProfile(myProfile ?? null)
    if (myProfile?.display_name) setNameInput(myProfile.display_name)
  }

  // ---------- profile upsert ----------
  async function saveDisplayName(e?: FormEvent) {
    if (e) e.preventDefault()
    if (!supabase || !user) return alert('請先登入')
    const display_name = nameInput.trim()
    if (!display_name) return alert('請輸入名稱')

    setIsSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, display_name, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) {
        console.error('save profile error', error)
        alert('儲存名稱失敗')
      } else {
        setProfile({ display_name })
        // refresh posts so names appear
        await fetchProfileAndPosts(supabase, user.id)
      }
    } finally {
      setIsSavingName(false)
    }
  }

  // ---------- create post ----------
  async function createPost(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !user) return alert('請先登入')
    const form = e.target as HTMLFormElement
    const content = (form.content as HTMLTextAreaElement).value.trim()
    if (!content) return alert('請輸入內容')

    setIsPosting(true)
    try {
      const { error } = await supabase.from('posts').insert({ content, user_id: user.id })
      if (error) {
        console.error('insert post error', error)
        alert('發佈失敗')
      } else {
        form.reset()
        await fetchProfileAndPosts(supabase, user.id)
      }
    } finally {
      setIsPosting(false)
    }
  }

  // ---------- UI ----------
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-semibold mb-6">我的小站</h1>

      {!user ? (
        <div className="card">
          <p className="mb-3">輸入 Email 登入（magic link）</p>
          <form onSubmit={(e) => { e.preventDefault(); const email = (e.target as HTMLFormElement).email.value; signUpOrSignIn(email) }}>
            <input name="email" type="email" placeholder="you@example.com" className="input mb-3" required />
            <button className="btn btn-primary" disabled={isSendingLink} aria-busy={isSendingLink}>
              {isSendingLink ? '發送中...' : '發送登入連結'}
            </button>
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

          <div className="card mb-6">
            <form onSubmit={createPost}>
              <textarea name="content" className="input mb-3" rows={4} placeholder="寫點什麼..." />
              <button type="submit" className="btn btn-primary w-full" disabled={isPosting} aria-busy={isPosting}>
                {isPosting ? '發佈中...' : '發佈'}
              </button>
            </form>
          </div>

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
