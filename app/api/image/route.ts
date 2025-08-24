import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";
import { requireRole } from "@/lib/descope";

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ["image-agent"]);
  if ("error" in auth) return NextResponse.json(auth, { status: auth.status });

  const { prompt } = await req.json();
  const image = await generateImage(prompt);
  return NextResponse.json({ result: image });
}
