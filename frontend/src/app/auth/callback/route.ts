import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('Failed to exchange OAuth code for session:', err);
    }
  }

  // Redirect to dashboard page
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
