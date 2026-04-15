import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Lazy initialization to prevent crash on startup if keys are missing or invalid
let supabaseClient: any = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
      console.warn('Supabase credentials missing or invalid. Please add a valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables via the Secrets panel.');
      return null;
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// For backward compatibility but with a guard
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
