import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Debugging Vercel Env Vars
console.log('--- Supabase Config Init ---')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('Env Keys:', Object.keys(process.env))
console.log('Supabase URL exists:', !!supabaseUrl)
console.log('Supabase Key exists:', !!supabaseServiceKey)
console.log('----------------------------')

if (!supabaseUrl || !supabaseServiceKey) {
  // Don't throw immediately to allow logging to be flushed/viewed
  console.error('CRITICAL: Missing Supabase credentials in environment variables')
}

// Create client even if missing (will fail on use) to prevent boot crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key'
)
