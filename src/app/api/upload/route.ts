import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
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

    // Get file from form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF allowed" }, { status: 400 });

    // Upload to Supabase Storage (bucket: pdf, folder: pdf/)
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `pdf/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from("pdf").upload(filePath, file, { contentType: "application/pdf" });
    if (uploadError) {
      console.error("Supabase upload error:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert record in pdf table
    const insertPayload = {
      name: file.name,
      path: filePath,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    };
    console.log("Inserting PDF record:", insertPayload);
    const { data: record, error: dbError } = await supabase
      .from("pdf")
      .insert([insertPayload])
      .select()
      .single();
    if (dbError) {
      console.error("Supabase DB insert error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Upload successful", record });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
