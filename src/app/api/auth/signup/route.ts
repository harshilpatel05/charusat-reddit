import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Supabase client (use service role key server-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { name, email, password, isFaculty } = await req.json();


        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into DB
        const { data: user, error } = await supabase
            .from("users")
            .insert([
                {
                    name,
                    email,
                    password: hashedPassword,
                    is_faculty: isFaculty, // ✅ store in DB
                },
            ])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email }, // payload
            process.env.JWT_SECRET!,            // secret
            { expiresIn: "7d" }                 // token validity
        );

        // Don’t return password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { user: userWithoutPassword, token },
            { status: 201 }
        );
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
