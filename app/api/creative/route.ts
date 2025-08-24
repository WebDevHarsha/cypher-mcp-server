import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";
import { requireRole } from "@/lib/descope";

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ["creative-agent"]);
  if ("error" in auth) return NextResponse.json(auth, { status: auth.status });

  const { input } = await req.json();
  const caption = await generateText(`Write a catchy social media caption for: ${input}`);
  return NextResponse.json({ result: caption });
}
