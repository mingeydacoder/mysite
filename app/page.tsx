// app/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useState, FormEvent } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import Cropper, { type Area } from 'react-easy-crop'
import { FaFacebookF, FaGithub, FaInstagram } from 'react-icons/fa'
import { createBrowserSupabaseClient } from '../lib/supabaseClient'
import FadeIn from '../components/FadeIn'
import WeatherNow from '../components/weathernow'




interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: Profile
}

interface Profile {
  display_name?: string
  avatar_url?: string
}

interface Announcement {
  id: string
  title: string
  summary?: string
  content?: string
  date?: string
}

const SITE_OWNER = {
  name: 'Welcome!!',
  // 建議放 public 底下的圖片路徑或外部 URL
  avatar: '/site-owner-avatar.png',
  bio: '注意：一般用戶無需註冊帳號'
}

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://www.instagram.com/', icon: FaInstagram, className: 'social-instagram' },
  { name: 'Facebook', href: 'https://www.facebook.com/', icon: FaFacebookF, className: 'social-facebook' },
  { name: 'GitHub', href: 'https://github.com/mingeydacoder', icon: FaGithub, className: 'social-github' },
]

function cropImage(imageSrc: string, crop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('無法建立圖片裁切畫布'))
        return
      }

      canvas.width = 512
      canvas.height = 512
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('無法產生裁切圖片')),
        'image/webp',
        0.9,
      )
    }
    image.onerror = () => reject(new Error('無法讀取圖片'))
    image.src = imageSrc
  })
}

function UserAvatar({ profile, fallbackName, size = 'md' }: {
  profile?: Profile | null
  fallbackName?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-xl',
  }[size]
  const initial = (profile?.display_name || fallbackName || '?').trim().charAt(0).toUpperCase()

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`${profile.display_name || fallbackName || '使用者'}的頭像`}
        className={`${sizeClass} shrink-0 rounded-full border border-[var(--border)] object-cover`}
      />
    )
  }

  return (
    <div
      aria-label={`${profile?.display_name || fallbackName || '使用者'}的預設頭像`}
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700`}
    >
      {initial}
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="內容載入中" aria-busy="true">
      {[0, 1].map(item => (
        <div key={item} className="card space-y-4">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-28" />
        </div>
      ))}
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="space-y-4" aria-label="貼文載入中" aria-busy="true">
      {[0, 1, 2].map(item => (
        <div key={item} className="post-item space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-40" />
            </div>
          </div>
          <div className="skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

function AnnouncementBoard({ announcements, onSelect }: {
  announcements: Announcement[]
  onSelect: (announcement: Announcement) => void
}) {
  return (
    <div className="card w-full p-0 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">佈告欄</div>
          <div className="kv text-sm">點擊查看完整內容</div>
        </div>
        <div className="kv text-xs">{announcements.length} 則</div>
      </div>

      <div className="p-3 overflow-y-auto" style={{ maxHeight: 480 }}>
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <button
              key={announcement.id}
              type="button"
              className="panel-item block w-full p-3 cursor-pointer text-left"
              onClick={() => onSelect(announcement)}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="flex-1">
                  <div className="font-bold mt-1 line-clamp-2">{announcement.title}</div>
                  <div className="kv text-sm mt-1 line-clamp-2">{announcement.summary}</div>
                </div>
                <div className="kv text-xs sm:ml-3">{announcement.date}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


export default function HomePage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [isPostsLoading, setIsPostsLoading] = useState(false)
  const [avatarSource, setAvatarSource] = useState<string | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 })
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarCropPixels, setAvatarCropPixels] = useState<Area | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [communityTab, setCommunityTab] = useState<'posts' | 'announcements'>('posts')

  // auth form state
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isForgotSending, setIsForgotSending] = useState(false)

  // announcement modal
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null)

  // sample announcements (site-wide). 可改成從 DB 讀取
  const announcements: Announcement[] = [
    {
      id: 'a3',
      title: '網站更新：手機版介面與後端恢復',
      summary: '已完成新版 Supabase 串接，並優化手機與桌面瀏覽體驗。',
      content: `本次更新完成以下調整：

1. 重新串接新的 Supabase project，恢復註冊、登入、留言與收藏功能。
2. 建立新版資料庫 schema，包含 profiles、posts、favorites。
3. 優化手機版首頁排版，登入區、佈告欄、自我介紹與天氣卡在小螢幕上更順暢。
4. 調整收藏頁表單與列表，長網址和長文字不會撐破畫面。
5. 改善按鈕與輸入框的觸控高度，手機操作更直覺。
6. 縮短頁面淡入動畫，整體載入感更俐落。`,
      date: '2026-06-03',
    },
    {
      id: 'a1',
      title: '2026加州自由行',
      summary: '懶人包網頁已上線，內含行程規劃與注意事項',
      content: `<a href="https://allenchen0121s-private-organizat.gitbook.io/2026_california_trip"
          target="_blank" rel="noopener noreferrer" class="text-indigo-600">網頁請點此
        </a>
      `,
      date: '2025-11-01',
    },
    {
      id: 'a2',
      title: '公告：新功能上線',
      summary: '已上線：收藏功能、個人化顯示名稱與留言系統優化。',
      content: '我們針對留言系統做了優化，提升載入效能與 UX。若遇到任何問題，請回報。',
      date: '2025-10-20',
    },
  ]

  // ---------- Fetch posts & profiles ----------
  const fetchProfileAndPosts = useCallback(async (sb: SupabaseClient, uid: string) => {
    setIsPostsLoading(true)
    const { data: postsData, error: postsErr } = await sb
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })

    if (postsErr) {
      console.error('fetch posts error', postsErr)
      setPosts([])
      setIsPostsLoading(false)
      return
    }

    const postsList = (postsData as Post[]) || []
    const userIds = Array.from(new Set(postsList.map(p => p.user_id).filter(Boolean)))

    if (userIds.length === 0) {
      setPosts(postsList)
    } else {
      const { data: profilesData } = await sb
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      const profiles = (profilesData ?? []) as (Profile & { user_id: string })[]
      const profileById = new Map<string, Profile>()
      for (const pr of profiles) profileById.set(pr.user_id, {
        display_name: pr.display_name,
        avatar_url: pr.avatar_url,
      })

      const postsWithProfiles = postsList.map(p => ({
        ...p,
        profiles: profileById.get(p.user_id),
      }))
      setPosts(postsWithProfiles)
    }

    const { data: myProfile } = await sb.from('profiles').select('display_name, avatar_url').eq('user_id', uid).maybeSingle()
    setProfile(myProfile ?? null)
    if (myProfile?.display_name) setNameInput(myProfile.display_name)
    setIsPostsLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id
      setUser(data.session?.user ?? null)
      if (uid) fetchProfileAndPosts(supabase, uid)
    }).catch(console.error).finally(() => setIsSessionLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setIsSessionLoading(false)
      if (session?.user?.id) fetchProfileAndPosts(supabase, session.user.id)
      else {
        setProfile(null)
        setPosts([])
      }
    })

    return () => sub?.subscription?.unsubscribe?.()
  }, [fetchProfileAndPosts, supabase])

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

  function closeAvatarCropper() {
    if (avatarSource) URL.revokeObjectURL(avatarSource)
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setAvatarSource(null)
    setAvatarPreviewUrl(null)
    setAvatarCrop({ x: 0, y: 0 })
    setAvatarZoom(1)
    setAvatarCropPixels(null)
  }

  async function updateAvatarPreview(croppedAreaPixels: Area) {
    setAvatarCropPixels(croppedAreaPixels)
    if (!avatarSource) return

    try {
      const previewBlob = await cropImage(avatarSource, croppedAreaPixels)
      const nextPreviewUrl = URL.createObjectURL(previewBlob)
      setAvatarPreviewUrl(current => {
        if (current) URL.revokeObjectURL(current)
        return nextPreviewUrl
      })
    } catch (error) {
      console.error('avatar preview error', error)
    }
  }

  function selectAvatar(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) return alert('頭像僅支援 JPG、PNG 或 WebP')
    if (file.size > 5 * 1024 * 1024) return alert('頭像大小不可超過 5 MB')

    if (avatarSource) URL.revokeObjectURL(avatarSource)
    setAvatarSource(URL.createObjectURL(file))
    setAvatarCrop({ x: 0, y: 0 })
    setAvatarZoom(1)
    setAvatarCropPixels(null)
  }

  async function uploadAvatar() {
    if (!supabase || !user) return alert('請先登入')
    if (!avatarSource || !avatarCropPixels) return alert('請先選擇裁切範圍')

    setIsUploadingAvatar(true)
    let croppedAvatar: Blob
    try {
      croppedAvatar = await cropImage(avatarSource, avatarCropPixels)
    } catch (error) {
      setIsUploadingAvatar(false)
      alert(error instanceof Error ? error.message : '頭像裁切失敗')
      return
    }

    const filePath = `${user.id}/avatar-${Date.now()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, croppedAvatar, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      setIsUploadingAvatar(false)
      alert('頭像上傳失敗：' + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const displayName = profile?.display_name || user.email?.split('@')[0] || '使用者'
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name: displayName,
        avatar_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setIsUploadingAvatar(false)
    if (profileError) {
      await supabase.storage.from('avatars').remove([filePath])
      alert('頭像儲存失敗：' + profileError.message)
      return
    }

    setProfile(current => ({ ...current, display_name: displayName, avatar_url: publicUrlData.publicUrl }))
    setNameInput(displayName)
    closeAvatarCropper()
    await fetchProfileAndPosts(supabase, user.id)
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
    <div className="space-y-6 sm:space-y-8">
      <FadeIn delay={200} className="section-anchor" style={{ scrollMarginTop: '7rem' }}>
      <section id="about">
      <div className="relative inline-block max-w-full">
        {/* 筆刷圖 */}
        <img
          src="/brush.png"
          alt="brush"
          className="pointer-events-none absolute -z-10 left-2 -top-4 w-48 sm:w-64 opacity-80 
                    transform filter blur-sm mix-blend-multiply scale-x-140 rotate-[-5deg]"
          style={{ filter: 'blur(0.6px)' }}
        />

        <h1 className="text-black text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mb-4">
          Intro Page
        </h1>
      </div>

      {/* ---------- 靜態網站主自我介紹（所有人可見） ---------- */}
      

        <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <img
              src={defaultAvatar}
              alt="site owner avatar"
              className="h-24 w-24 sm:h-[105px] sm:w-[105px]"
              style={{ objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}
            />
          </div>
          <div className="flex-1">
            <div className="text-2xl sm:text-3xl font-semibold sm:mt-3">{SITE_OWNER.name}</div>
            <div className="kv text-sm mt-3">{SITE_OWNER.bio}</div>
          </div>
            <div className="w-full sm:w-auto">
              {/* avatar + main content */}
              {/* 動態天氣元件（自動以 "Columbia, SC" 查詢） */}
              <WeatherNow location="Columbia, SC" />
            </div>

        </div>
      </div>
      </section>

      </FadeIn>


      <FadeIn delay={300} className="section-anchor">
      <section id="community">
      {isSessionLoading ? (
        <HomeSkeleton />
      ) : !user ? (
        /* 未登入：登入卡 + 公告外框（多個公告）並排（mobile 會堆疊） */
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          {/* 登入卡（左） */}
          <div className="w-full">
            <div className="card w-full space-y-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
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

                  <div className="pt-3 text-sm">
                    <label className="kv">忘記密碼？</label>
                    <div className="flex flex-col gap-2 mt-2 sm:flex-row">
                      <input
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        type="email"
                        placeholder="you@example.com"
                        className="input"
                      />
                      <button
                        type="button"
                        className="btn btn-ghost sm:w-auto"
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

          {/* 公告外框（右）：寬高與登入卡一致，內部有多個小公告卡 */}
          <div className="w-full">
            <AnnouncementBoard announcements={announcements} onSelect={setSelectedAnn} />
          </div>
        </div>
      ) : (
        /* 已登入的原本內容（維持你現有的 layout） */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 space-y-6">
            <div className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserAvatar profile={profile} fallbackName={user.email} size="md" />
                  <div>
                    <div className="kv">已登入</div>
                    <div className="font-medium break-all">{profile?.display_name ?? user.email}</div>
                  </div>
                </div>
                <button className="btn btn-ghost sm:w-auto" onClick={signOut}>
                  登出
                </button>
              </div>

              <div className="mb-4">
                <label className={`btn btn-ghost w-full sm:w-auto ${isUploadingAvatar ? 'cursor-wait opacity-60' : ''}`}>
                  {isUploadingAvatar ? '頭像上傳中...' : profile?.avatar_url ? '更換頭像' : '上傳頭像'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isUploadingAvatar}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) selectAvatar(file)
                      e.target.value = ''
                    }}
                  />
                </label>
                <div className="kv mt-2">支援 JPG、PNG、WebP，最大 5 MB</div>
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
                  <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isSavingName}>
                    {isSavingName ? '儲存中...' : '儲存名稱'}
                  </button>
                </form>
              )}
            </div>

            <div className="card p-2">
              <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="社群內容">
                <button
                  type="button"
                  role="tab"
                  aria-selected={communityTab === 'posts'}
                  className={`btn ${communityTab === 'posts' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCommunityTab('posts')}
                >
                  貼文
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={communityTab === 'announcements'}
                  className={`btn ${communityTab === 'announcements' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCommunityTab('announcements')}
                >
                  公告
                </button>
              </div>
            </div>

            {communityTab === 'posts' ? (
              <>
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

                <div id="posts" className="card section-anchor">
                  <h2 className="text-lg font-semibold mb-4">貼文</h2>
                  {isPostsLoading ? (
                    <PostsSkeleton />
                  ) : posts.length === 0 ? (
                    <p className="kv">目前沒有貼文</p>
                  ) : (
                    <ul className="space-y-4">
                      {posts.map((p) => (
                        <li key={p.id} className="post-item">
                          <div className="flex items-center gap-3">
                            <UserAvatar profile={p.profiles} fallbackName="匿名" size="sm" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {p.profiles?.display_name ?? '匿名'}
                              </div>
                              <div className="meta mb-0">{new Date(p.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap break-words">{p.content}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <AnnouncementBoard announcements={announcements} onSelect={setSelectedAnn} />
            )}
          </section>

          {/* 側欄 */}
          <aside className="md:col-span-1 space-y-4">
            <div className="card">
              <h3 className="text-lg font-medium mb-3">快速連結</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1">
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
                  onClick={() => window.open('https://tw.stock.yahoo.com', '_blank', 'noopener')}
                >
                  Yahoo Stock
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.open('https://chatgpt.com', '_blank', 'noopener')}
                >
                  ChatGPT
                </button>

              </div>
            </div>
          </aside>
        </div>
      )}
      </section>
      </FadeIn>

      <FadeIn delay={375}>
        <section className="flex justify-center pt-4" aria-label="社群連結">
          <div className="social-links">
            {SOCIAL_LINKS.map(({ name, href, icon: Icon, className }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                title={name}
                className={`social-drop ${className}`}
              >
                <Icon aria-hidden />
              </a>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Avatar Crop Modal */}
      {avatarSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-backdrop" onClick={isUploadingAvatar ? undefined : closeAvatarCropper} />
          <div className="modal-panel max-w-2xl p-4 sm:p-6">
            <h2 className="text-xl font-bold">裁切頭像</h2>
            <p className="kv mt-1 text-sm">拖曳圖片調整位置，使用滑桿縮放。</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
              <div className="relative h-72 overflow-hidden rounded-lg bg-gray-950">
                <Cropper
                  image={avatarSource}
                  crop={avatarCrop}
                  zoom={avatarZoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setAvatarCrop}
                  onZoomChange={setAvatarZoom}
                  onCropComplete={(_area, croppedAreaPixels) => updateAvatarPreview(croppedAreaPixels)}
                />
              </div>
              <div className="text-center">
                <div className="kv mb-2">裁切後預覽</div>
                {avatarPreviewUrl ? (
                  <img src={avatarPreviewUrl} alt="裁切後頭像預覽" className="mx-auto h-32 w-32 rounded-full border border-[var(--border)] object-cover" />
                ) : (
                  <div className="skeleton mx-auto h-32 w-32 rounded-full" />
                )}
              </div>
            </div>

            <label className="form-label mt-4">
              縮放
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={avatarZoom}
                onChange={(e) => setAvatarZoom(Number(e.target.value))}
                className="mt-2 w-full accent-indigo-600"
              />
            </label>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-ghost sm:w-auto" onClick={closeAvatarCropper} disabled={isUploadingAvatar}>
                取消
              </button>
              <button type="button" className="btn btn-primary sm:w-auto" onClick={uploadAvatar} disabled={isUploadingAvatar || !avatarCropPixels}>
                {isUploadingAvatar ? '處理並上傳中...' : '確認裁切並上傳'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Announcement Modal */}
      {selectedAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-backdrop" onClick={() => setSelectedAnn(null)} />
          <div className="modal-panel max-w-2xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedAnn.title}</h2>
                <div className="kv text-sm mt-1">{selectedAnn.date}</div>
              </div>
            </div>

            <div
            className="mt-4 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: selectedAnn.content || '' }}
          />


            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary" onClick={() => setSelectedAnn(null)}>我知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
