import { createClient } from '@supabase/supabase-js'
// Note: dotenv removed - Vercel provides environment variables directly via process.env

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Debugging Vercel Env Vars
console.log('--- Supabase Config Init ---')
console.log('NODE_ENV:', process.env.NODE_ENV)
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
