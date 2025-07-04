import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
export const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET
