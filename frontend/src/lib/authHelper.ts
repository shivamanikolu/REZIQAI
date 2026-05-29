export interface CachedSession {
  expires_at?: number;
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
    };
    app_metadata?: {
      provider?: string;
    };
  };
}

export const getCachedSession = (): CachedSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          const cached: CachedSession = JSON.parse(val);
          if (cached?.expires_at) {
            const expiresAtMs = cached.expires_at * 1000;
            if (Date.now() > expiresAtMs) {
              return null;
            }
          }
          return cached;
        }
      }
    }
  } catch (e) {
    console.error('Error reading cached session:', e);
  }
  return null;
};
