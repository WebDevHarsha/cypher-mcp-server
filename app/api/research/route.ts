import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";
import { requireRole } from "@/lib/descope";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ["research-agent"]);
  if ("error" in auth) return NextResponse.json(auth, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") ?? "technology";
  
  const result = await generateText(`Get me the latest news and trends about ${topic}`);
  return NextResponse.json({ result });
}
