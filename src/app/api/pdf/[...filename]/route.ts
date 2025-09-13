import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

type CatchAllParams = { params: Promise<{ filename: string[] }> }

export async function GET(
  req: NextRequest,
  { params }: CatchAllParams
): Promise<NextResponse> {
  const resolved = await params
  const filePath = resolved.filename.join("/") 

  const { data, error } = await supabase.storage
    .from("pdf")
    .createSignedUrl(filePath, 30)

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "File not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ url: data.signedUrl })
}
