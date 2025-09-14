import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, password, isFaculty } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          is_faculty: isFaculty,
        },
      ])
      .select()
      .single();

    if (error || !newUser) {
      console.error("[Signup] Insert error:", error);
      return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });
    }

    // Generate token using actual DB id
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, isFaculty: newUser.is_faculty },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Remove password before returning
    const { password: _removed, ...userWithoutPassword } = newUser;

    return NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
