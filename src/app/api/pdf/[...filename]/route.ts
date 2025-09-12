import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

// Match Next.js validator (expects Promise<{ filename: string[] }>)
type CatchAllParams = { params: Promise<{ filename: string[] }> }

export async function GET(
  req: NextRequest,
  { params }: CatchAllParams
): Promise<NextResponse> {
  // resolve params because Next.js types them as a Promise
  const resolved = await params
  const filePath = resolved.filename.join("/")

  const { data, error } = await supabase.storage.from("pdf").download(filePath)

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "File not found" },
      { status: 404 }
    )
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filePath}"`,
    },
  })
}
