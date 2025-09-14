// API route to receive and store push subscription for the current user
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.JWT_SECRET;
  if (!secret) return NextResponse.json({ error: "Server error" }, { status: 500 });
  let user;
  try {
    user = jwt.verify(token, secret) as { id: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const userId = user.id;
  const supabase = createClient(cookieStore);
  const { subscription } = await req.json();
  // Store subscription in a new table 'push_subscriptions' (user_id, subscription JSON)
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
