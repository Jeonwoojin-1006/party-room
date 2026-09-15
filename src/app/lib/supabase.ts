import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://toyzpvmyvlpmpljjeyey.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_l-51wxP0v_6nkNnte2KzWQ_jXrk6aB3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);