// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Mungojnë variablat VITE_SUPABASE_URL dhe VITE_SUPABASE_ANON_KEY në .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
