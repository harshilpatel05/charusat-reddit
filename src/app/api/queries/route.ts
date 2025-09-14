import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import webpush from "web-push"

// Configure webpush with your VAPID keys
webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_PUSH_CONTACT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.PUSH_VAPID_PRIVATE_KEY!
)

export async function GET(req: NextRequest) {
    try {
        const pdf = req.nextUrl.searchParams.get("pdf")
        if (!pdf) {
            return NextResponse.json({ error: "Missing pdf param" }, { status: 400 })
        }

        const supabase = createClient()

        const { data: queries, error } = await supabase
            .from("queries")
            .select("id, question, answer, asked_by, pdf_uploaded_by, pdf, created_at")
            .eq("pdf", pdf)
            .order("created_at", { ascending: true })

        if (error) {
            console.error("[Queries API] Fetch error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ queries })
    } catch (err: unknown) {
        console.error("[Queries API] Fatal error:", err)
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 })
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
// --- PATCH: update answer for a query ---
export async function PATCH(req: NextRequest) {
    try {
        const { id, answer } = await req.json()
        if (!id || !answer) {
            return NextResponse.json({ error: "Missing id or answer" }, { status: 400 })
        }

        // --- Auth ---
        const cookieStore = await cookies()
        const token = cookieStore.get("authToken")?.value
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const secret = process.env.JWT_SECRET
        if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

        let user
        try {
            user = jwt.verify(token, secret) as { id: string; email: string; isFaculty: boolean }
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        if (!user.isFaculty) {
            return NextResponse.json({ error: "Only faculty can answer queries" }, { status: 403 })
        }

        // --- Update query ---
        const supabase = createClient()
        const { data: updated, error } = await supabase
            .from("queries")
            .update({ answer })
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("[Queries API] Answer update error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ query: updated })
    } catch (err: unknown) {
        console.error("[Queries API] PATCH fatal error:", err)
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 })
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { question, pdf } = await req.json()
        console.log("[Queries API] Incoming:", { question, pdf })

        if (!question || !pdf) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 })
        }

        // --- Auth ---
        const cookieStore = await cookies()
        const token = cookieStore.get("authToken")?.value
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const secret = process.env.JWT_SECRET
        if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

        let user
        try {
            user = jwt.verify(token, secret) as { id: string; email: string }
            console.log("[Queries API] Authenticated user:", user)
        } catch (err) {
            console.error("[Queries API] Invalid token:", err)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // --- Supabase client ---
        const supabase = createClient()

        // --- Find PDF uploader ---
        const { data: pdfRow, error: pdfError } = await supabase
            .from("pdf")
            .select("uploaded_by")
            .eq("path", pdf)
            .single()

        if (pdfError || !pdfRow) {
            console.error("[Queries API] PDF fetch error:", pdfError)
            return NextResponse.json({ error: "PDF not found" }, { status: 404 })
        }

        // --- Insert query ---
        const { data: query, error: queryError } = await supabase
            .from("queries")
            .insert({
                question,
                pdf,
                asked_by: user.id,
                pdf_uploaded_by: pdfRow.uploaded_by,
            })
            .select()
            .single()

        if (queryError) {
            console.error("[Queries API] Query insert error:", queryError)
            return NextResponse.json({ error: queryError.message }, { status: 500 })
        }

        // --- Find uploader's push subscription ---
        const { data: subRow, error: subError } = await supabase
            .from("push_subscriptions")
            .select("subscription")
            .eq("user_id", pdfRow.uploaded_by)
            .single()

        if (subError) console.error("[Queries API] Subscription fetch error:", subError)

        if (subRow?.subscription) {
            try {
                await webpush.sendNotification(
                    subRow.subscription,
                    JSON.stringify({
                        title: "New Query on Your PDF!",
                        body: question,
                        url: `/dashboard?pdf=${pdf}`,
                    })
                )
                console.log("[Queries API] Push notification sent")
            } catch (err) {
                console.error("[Queries API] Push send failed:", err)
            }
        } else {
            console.log("[Queries API] No subscription found for uploader")
        }

        return NextResponse.json({ query })
    } catch (err: unknown) {
        console.error("[Queries API] Fatal error:", err)
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 })
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
