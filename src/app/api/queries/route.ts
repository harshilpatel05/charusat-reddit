// PATCH: answer a query (faculty uploader only)
export async function PATCH(req: NextRequest) {
  try {
    const { id, answer } = await req.json();
    if (!id || !answer) return NextResponse.json({ error: "Missing data" }, { status: 400 });
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
    // Check if user is the faculty uploader for this query
    const { data: query, error: queryError } = await supabase
      .from("queries")
      .select("pdf_uploaded_by")
      .eq("id", id)
      .single();
    if (queryError || !query) return NextResponse.json({ error: "Query not found" }, { status: 404 });
    if (query.pdf_uploaded_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Update answer
    const { data, error } = await supabase
      .from("queries")
      .update({ answer })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ query: data });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: fetch all queries for a PDF
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pdf = searchParams.get("pdf");
  if (!pdf) return NextResponse.json({ queries: [] });
  const { data, error } = await supabase
    .from("queries")
    .select("id, question, answer, asked_by, pdf_uploaded_by")
    .eq("pdf", pdf)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ queries: [] });
  return NextResponse.json({ queries: data });
}

// POST: add a new query
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
    // Find the PDF record to get uploaded_by
    const { data: pdfRecord, error: pdfError } = await supabase
      .from("pdf")
      .select("uploaded_by")
      .eq("path", pdf)
      .single();
    if (pdfError || !pdfRecord) return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    // Insert query
    const { data, error } = await supabase
      .from("queries")
      .insert([
        {
          question,
          pdf,
          asked_by: user.id,
          pdf_uploaded_by: pdfRecord.uploaded_by,
          answer: null,
        },
      ])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ query: data });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
