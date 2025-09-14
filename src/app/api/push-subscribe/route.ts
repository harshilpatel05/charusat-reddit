import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(req: NextRequest) {
  try {
    console.log("[Push-Subscribe API] Incoming request...")

    // --- Auth ---
    const cookieStore = await cookies()
    const token = cookieStore.get("authToken")?.value
    if (!token) {
      console.warn("[Push-Subscribe API] No auth token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error("[Push-Subscribe API] JWT_SECRET not set")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    let user
    try {
      user = jwt.verify(token, secret) as { id: string; email: string }
      console.log("[Push-Subscribe API] Authenticated user:", user)
    } catch (err) {
      console.error("[Push-Subscribe API] Invalid token:", err)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // --- Parse body ---
    const body = await req.json()
    const subscription = body.subscription ?? body
    if (!subscription || !subscription.endpoint) {
      console.error("[Push-Subscribe API] Invalid subscription object:", subscription)
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }
    console.log("[Push-Subscribe API] Valid subscription received")

    // --- Store subscription in DB ---
    const supabase = createClient()
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        subscription,
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("[Push-Subscribe API] Supabase insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[Push-Subscribe API] Subscription saved for user:", user.id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("[Push-Subscribe API] Fatal error:", err)
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
