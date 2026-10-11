// lib/supabase.js — one shared Supabase client for every API file.
// The URL and key come from environment variables (.env.local locally,
// Vercel → Settings → Environment Variables in production).
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set (add them to .env.local / Vercel)");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
