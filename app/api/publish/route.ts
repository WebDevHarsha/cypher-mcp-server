import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/descope";

// placeholder: add Twitter/Instagram/LinkedIn API integrations
export async function POST(req: NextRequest) {
  const auth = requireRole(req, ["publishing-agent"]);
  if ("error" in auth) return NextResponse.json(auth, { status: auth.status });

  const { text, image } = await req.json();

  // TODO: Call Instagram/Twitter/LinkedIn APIs
  return NextResponse.json({ status: "Posted successfully!", text, image });
}
