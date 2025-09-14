import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_PUSH_CONTACT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.PUSH_VAPID_PRIVATE_KEY!
);

// POST: add a new query and notify uploader
export async function POST(req: NextRequest) {
  try {
    const { question, pdf } = await req.json();
    if (!question || !pdf) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    // Auth: get user from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({ error: "Server error" }, { status: 500 });
    let user;
    try {
      user = jwt.verify(token, secret) as { id: string; email: string };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    // Find PDF uploader
    const { data: pdfRow } = await supabase
      .from("pdf")
      .select("uploaded_by")
      .eq("key", pdf)
      .single();
    if (!pdfRow) return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    // Insert query
    const { data: query, error } = await supabase
      .from("queries")
      .insert({ question, pdf, asked_by: user.id, pdf_uploaded_by: pdfRow.uploaded_by })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Find uploader's push subscription
    const { data: subRow } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", pdfRow.uploaded_by)
      .single();
    if (subRow && subRow.subscription) {
      // Send push notification
      await webpush.sendNotification(
        subRow.subscription,
        JSON.stringify({
          title: "New Query on Your PDF!",
          body: question,
          url: `/`
        })
      ).catch(() => {});
    }
    return NextResponse.json({ query });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
