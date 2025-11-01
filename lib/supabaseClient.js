// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// 這兩個環境變數會在 .env.local 裡設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
