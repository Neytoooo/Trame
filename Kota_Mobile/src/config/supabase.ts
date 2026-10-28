import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_CONFIG } from './env'

export const supabase = createClient(
  DEFAULT_CONFIG.SUPABASE_URL,
  DEFAULT_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
