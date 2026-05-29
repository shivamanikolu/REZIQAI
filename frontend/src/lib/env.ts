const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    // Only warn during local build, or allow soft warning to not break local environments if variables are missing
    console.warn(`Warning: Missing environment variable: ${key}`);
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reziqai.vercel.app',
};

export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }
    // relative redirect on Vercel
    return process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/_/backend`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

