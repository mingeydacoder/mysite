// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * 在瀏覽器端呼叫來建立 supabase client。
 * 如果在 server side 或 env 缺失，會回傳 null。
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // 只輸出 warn，避免 build 因為未定義 env 而中斷（我們會在部署時補上 env）
    console.warn('Supabase env not found in browser:', { url, anon })
    return null
  }

  return createClient(url, anon)
}
