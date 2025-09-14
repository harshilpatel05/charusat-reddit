import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ id: null });
    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({ id: null });
    let user;
    try {
      user = jwt.verify(token, secret) as { id: string };
      return NextResponse.json({ id: user.id });
    } catch {
      return NextResponse.json({ id: null });
    }
  } catch {
    return NextResponse.json({ id: null });
  }
}
