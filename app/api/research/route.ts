import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!, 
});

const groundingTool = {
  googleSearch: {},
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    if (!topic) {
      return NextResponse.json(
        { error: "Missing `topic` query param" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Research the latest updates and key insights about: ${topic}. 
                 `,
      config: {
        tools: [groundingTool],
      },
    });

    return NextResponse.json({
      topic,
      result: response.text ?? "", 
    });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
