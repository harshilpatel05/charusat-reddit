import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 })
    }

    // Get user from DB
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, isFaculty: user.is_faculty },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    // Prepare user object (strip password)
    const { password: _removed, ...userWithoutPassword } = user

    // Create response
    const res = NextResponse.json({
      user: userWithoutPassword,
      token, // optional: you can omit this if you only want cookie auth
    })

    // Set cookie
    res.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
