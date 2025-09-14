// API route to receive and store push subscription for the current user
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { subscription } = await req.json();
  // Get user from JWT (assume /api/userid returns user id)
  const userRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/userid`, {
    headers: req.headers,
    method: 'GET',
    credentials: 'include',
  });
  const { id: userId } = await userRes.json();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // Store subscription in a new table 'push_subscriptions' (user_id, subscription JSON)
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
