export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpeawtetkramoukhkpih.supabase.co',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZWF3dGV0a3JhbW91a2hrcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTk0MzEsImV4cCI6MjA5NTUzNTQzMX0.Bg5VwRD1xa61I0AyGgQA7wkZbzv0Ulx5MUX8rA6W5jc',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reziqai.vercel.app',
};

export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }
    // In production, ignore env variables pointing to localhost to prevent local configs from breaking live site
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
      return envApiUrl;
    }
    return `${window.location.origin}/_/backend`;
  }

  // Server-side (SSR) execution
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
    return envApiUrl;
  }
  // If running on Vercel server, VERCEL_URL is set automatically to the domain
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/_/backend`;
  }
  return 'http://localhost:8000';
};

