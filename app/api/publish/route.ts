// app/api/publish/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body?.text;

    if (!text) {
      return NextResponse.json(
        { error: "Missing `text` in request body" },
        { status: 400 }
      );
    }

    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "X_BEARER_TOKEN is not set in environment" },
        { status: 500 }
      );
    }

    // X API endpoint
    const url = "https://api.x.com/2/tweets";

    const options: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text, // the user-approved tweet text
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error("X API error:", data);
      return NextResponse.json(
        { error: "Failed to publish tweet", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      posted: data,
    });
  } catch (err: any) {
    console.error("Publish agent error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
