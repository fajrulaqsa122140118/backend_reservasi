import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// ✅ Gunakan variabel environment yang sesuai
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // HARUS pakai service role key untuk hapus file

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// ✅ Buat client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ✅ Nama bucket (bisa 'uploads', dll.)
export const supabaseStorageBucket = process.env.SUPABASE_BUCKET
  