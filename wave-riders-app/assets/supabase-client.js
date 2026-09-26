// Publishable (anon) key only — safe to expose in client-side code.
const SUPABASE_URL = "https://aryxyfiqgommrsnmiexj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_iGYNGL-PnUVrMKhnUkjnNg_cdpddXqc";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
