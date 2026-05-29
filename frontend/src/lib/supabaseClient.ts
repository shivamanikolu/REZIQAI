import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in frontend env.');
}

const createMockSupabaseClient = () => {
  const mockFn = () => {};
  const proxy: any = new Proxy(mockFn, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve({
          data: {
            session: null,
            user: null,
            publicUrl: '',
            subscription: { unsubscribe: () => {} }
          },
          error: null
        });
      }
      if (prop === 'onAuthStateChange') {
        return () => ({ data: { subscription: { unsubscribe: () => {} } } });
      }
      if (prop === 'data') {
        return { publicUrl: '' };
      }
      if (typeof prop === 'symbol') {
        return undefined;
      }
      return proxy;
    },
    apply(target, thisArg, argumentsList) {
      return proxy;
    }
  });
  return proxy;
};

export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createMockSupabaseClient();

