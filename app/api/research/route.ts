// app/api/research/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!, // store safely in .env
});

// Define grounding tool (Google Search)
const groundingTool = {
  googleSearch: {},
};

// API Route handler
export async function GET(req: NextRequest) {
  try {
    // Extract topic from query params: /api/research?topic=xyz
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    if (!topic) {
      return NextResponse.json(
        { error: "Missing `topic` query param" },
        { status: 400 }
      );
    }

    // Call Gemini with grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Research the latest updates and key insights about: ${topic}. 
                 `,
      config: {
        tools: [groundingTool],
      },
    });

    // Return grounded text response
    return NextResponse.json({
      topic,
      result: response.text ?? "", // Gemini’s grounded text
    });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
