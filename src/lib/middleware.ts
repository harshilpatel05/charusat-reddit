import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  console.log("✅ Middleware is running:", req.nextUrl.pathname)
  return NextResponse.redirect(new URL("/login", req.url))
}

export const config = {
  matcher: ["/"],
}
