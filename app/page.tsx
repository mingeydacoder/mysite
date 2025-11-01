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

interface Profile {
  display_name?: string
}

const SITE_OWNER = {
  name: 'HI! This is a website created by Allen Chen',
  // 建議放 public 底下的圖片路徑或外部 URL
  avatar: '/site-owner-avatar.png',
  bio: 'from National Taiwan University.'
}

export default function HomePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  // auth form state
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isForgotSending, setIsForgotSending] = useState(false)

  useEffect(() => {
    const sb = createBrowserSupabaseClient()
    if (!sb) return
    setSupabase(sb)

    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id
      setUser(data.session?.user ?? null)
      if (uid) fetchProfileAndPosts(sb, uid)
    }).catch(console.error)

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.id) fetchProfileAndPosts(sb, session.user.id)
      else {
        setProfile(null)
        setPosts([])
      }
    })

    return () => sub?.subscription?.unsubscribe?.()
  }, [])

  // ---------- Auth ----------
  async function signUp() {
    if (!supabase) return
    setIsAuthLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setIsAuthLoading(false)
    if (error) {
      console.error(error)
      alert('註冊失敗：' + error.message)
    } else {
      alert('註冊成功，請檢查信箱或直接登入！')
    }
  }

  async function signIn() {
    if (!supabase) return
    setIsAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsAuthLoading(false)
    if (error) {
      console.error(error)
      alert('登入失敗：請確認帳號與密碼')
    }
  }

  async function sendResetPasswordEmail() {
    if (!supabase) return
    setIsForgotSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail)
    setIsForgotSending(false)
    if (error) {
      alert('寄送失敗：' + error.message)
    } else {
      alert('已寄出密碼重設信，請查收。')
    }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setPosts([])
  }

  // ---------- Fetch posts & profiles ----------
  async function fetchProfileAndPosts(sb: SupabaseClient, uid: string) {
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

    if (userIds.length === 0) {
      setPosts(postsList)
    } else {
      const { data: profilesData } = await sb
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      const profiles = (profilesData ?? []) as { user_id: string; display_name?: string }[]
      const nameById = new Map<string, string | undefined>()
      for (const pr of profiles) nameById.set(pr.user_id, pr.display_name)

      const postsWithProfiles = postsList.map(p => ({
        ...p,
        profiles: { display_name: nameById.get(p.user_id) ?? undefined },
      }))
      setPosts(postsWithProfiles)
    }

    const { data: myProfile } = await sb.from('profiles').select('display_name').eq('user_id', uid).maybeSingle()
    setProfile(myProfile ?? null)
    if (myProfile?.display_name) setNameInput(myProfile.display_name)
  }

  // ---------- Profile ----------
  async function saveDisplayName(e?: FormEvent) {
    if (e) e.preventDefault()
    if (!supabase || !user) return alert('請先登入')
    const display_name = nameInput.trim()
    if (!display_name) return alert('請輸入名稱')

    setIsSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, display_name, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setIsSavingName(false)
    if (error) {
      alert('儲存失敗')
    } else {
      setProfile({ display_name })
      fetchProfileAndPosts(supabase, user.id)
    }
  }

  // ---------- Post ----------
  async function createPost(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !user) return alert('請先登入')
    const form = e.target as HTMLFormElement
    const content = (form.content as HTMLTextAreaElement).value.trim()
    if (!content) return alert('請輸入內容')

    setIsPosting(true)
    const { error } = await supabase.from('posts').insert({ content, user_id: user.id })
    setIsPosting(false)
    if (error) alert('發佈失敗')
    else {
      form.reset()
      fetchProfileAndPosts(supabase, user.id)
    }
  }

  // ---------- UI ----------
  const defaultAvatar = SITE_OWNER.avatar || '/default-avatar.png' // 可改

  return (
    <div className="container py+10">
      <h1 className="text-4xl font-extrabold font-mono tracking-tight text-indigo-700 mb-4">
        Intro Page
      </h1>

      {/* ---------- 靜態網站主自我介紹（所有人可見） ---------- */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div style={{ minWidth: 96 }}>
            <img
              src={defaultAvatar}
              alt="site owner avatar"
              style={{ width: 105, height: 105, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}
            />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">{SITE_OWNER.name}</div>
            <div className="kv text-sm mt-1">{SITE_OWNER.bio}</div>
          </div>
        </div>
      </div>

      {/* ---------- 原本內容（登入 / 註冊 / 發文 / 貼文 / 側欄） ---------- */}
      {!user ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="card max-w-md space-y-4">
            <div className="flex gap-2 mb-3">
              <button
                className={`btn ${view === 'sign-in' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setView('sign-in')}
              >
                登入
              </button>
              <button
                className={`btn ${view === 'sign-up' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setView('sign-up')}
              >
                註冊
              </button>
            </div>

            {view === 'sign-in' ? (
              <form onSubmit={(e) => { e.preventDefault(); signIn() }} className="space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="input"
                  required
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="input"
                  required
                />
                <button type="submit" className="btn btn-primary w-full" disabled={isAuthLoading}>
                  {isAuthLoading ? '登入中...' : '登入'}
                </button>

                <div className="pt-2 text-sm">
                  <label className="kv">忘記密碼？</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      type="email"
                      placeholder="you@example.com"
                      className="input"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={sendResetPasswordEmail}
                      disabled={isForgotSending}
                    >
                      {isForgotSending ? '發送中...' : 'Reset'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); signUp() }} className="space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="input"
                  required
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password (min 6)"
                  className="input"
                  minLength={6}
                  required
                />
                <button type="submit" className="btn btn-primary w-full" disabled={isAuthLoading}>
                  {isAuthLoading ? '註冊中...' : '註冊'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="kv">已登入</div>
                  <div className="font-medium">{profile?.display_name ?? user.email}</div>
                </div>
                <button className="btn btn-ghost" onClick={signOut}>
                  登出
                </button>
              </div>

              {!profile?.display_name && (
                <form onSubmit={saveDisplayName} className="space-y-3">
                  <label className="block text-sm kv">設定顯示名稱</label>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    name="display_name"
                    className="input"
                    placeholder="輸入你的名稱"
                  />
                  <button type="submit" className="btn btn-primary" disabled={isSavingName}>
                    {isSavingName ? '儲存中...' : '儲存名稱'}
                  </button>
                </form>
              )}
            </div>

            <div className="card">
              <form onSubmit={createPost}>
                <textarea name="content" className="input mb-3" rows={4} placeholder="寫點什麼..." />
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isPosting}
                >
                  {isPosting ? '發佈中...' : '發佈'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">貼文</h2>
              {posts.length === 0 ? (
                <p className="kv">目前沒有貼文</p>
              ) : (
                <ul className="space-y-4">
                  {posts.map((p) => (
                    <li key={p.id} className="post-item">
                      <div className="meta">{new Date(p.created_at).toLocaleString()}</div>
                      <div className="font-medium">
                        {p.profiles?.display_name ?? '匿名'}
                      </div>
                      <div className="mt-2">{p.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* 側欄 */}
          <aside className="md:col-span-1 space-y-4">
            <div className="card">
              <h3 className="text-lg font-medium mb-3">快速連結</h3>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.location.href = '/favorites'}
                >
                  我的收藏
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.location.href = '/settings'}
                >
                  我的設定
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.open('https://example.com', '_blank', 'noopener')}
                >
                  參考文件（外部）
                </button>

                {user?.email === 'you@example.com' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/admin'}
                  >
                    後台管理
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
