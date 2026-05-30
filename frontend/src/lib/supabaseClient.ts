import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpeawtetkramoukhkpih.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZWF3dGV0a3JhbW91a2hrcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTk0MzEsImV4cCI6MjA5NTUzNTQzMX0.Bg5VwRD1xa61I0AyGgQA7wkZbzv0Ulx5MUX8rA6W5jc';

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

