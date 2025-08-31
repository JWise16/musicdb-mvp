import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SupabaseClient: Initializing with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Ensure session persistence across tab switches
    persistSession: true,
    storageKey: 'musicdb-auth-token',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable this to prevent unnecessary auth events
    flowType: 'pkce', // Use PKCE flow for better security and stability
    debug: false // Disable debug mode to reduce noise
  },
  global: {
    headers: {
      'X-Client-Info': 'musicdb-web'
    }
  }
});

// Debug session state with more context
let lastAuthEvent: { event: string; user: string | null; timestamp: number } | null = null;

supabase.auth.onAuthStateChange((event, session) => {
  const now = Date.now();
  const currentUser = session?.user?.email || null;
  
  // Prevent logging duplicate events within a short time window
  if (lastAuthEvent && 
      lastAuthEvent.event === event && 
      lastAuthEvent.user === currentUser &&
      (now - lastAuthEvent.timestamp) < 2000) { // 2 second debounce
    return;
  }
  
  lastAuthEvent = { event, user: currentUser, timestamp: now };
  
  console.log('SupabaseClient: Auth state change detected', {
    event,
    user: currentUser,
    timestamp: new Date().toISOString(),
    timeSinceLastEvent: lastAuthEvent ? now - lastAuthEvent.timestamp : 0
  });
});
