import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  // Remove the authToken cookie
  return NextResponse.json({ success: true }, {
    status: 200,
    headers: {
      "Set-Cookie": `authToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax` // Expire the cookie
    }
  });
}
