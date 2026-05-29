import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in frontend env.');
}

const createMockSupabaseClient = () => {
  const queryProxy: any = new Proxy({}, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: null, error: null });
      }
      if (typeof prop === 'symbol') {
        return undefined;
      }
      return () => queryProxy;
    }
  });

  const authMock = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase is not configured') }),
    signInWithOAuth: () => Promise.resolve({ error: new Error('Supabase is not configured') }),
    signOut: () => Promise.resolve({ error: null }),
  };

  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'auth') {
        return authMock;
      }
      if (prop === 'from') {
        return () => queryProxy;
      }
      return () => Promise.resolve({ data: null, error: null });
    }
  };
  return new Proxy({}, handler) as any;
};

export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

