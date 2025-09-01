import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    if (!prompt) {
      return NextResponse.json({ error: "Missing `prompt` in body" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts || !Array.isArray(candidate.content.parts)) {
      return NextResponse.json({ error: "No content returned from image model" }, { status: 502 });
    }

    const images: Array<{ filename: string; b64: string; mime?: string }> = [];
    let imgIdx = 0;
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        const b64 = part.inlineData.data;
        
        images.push({
          filename: `gen-image-${Date.now()}-${imgIdx}.png`,
          b64,
          mime: part.inlineData.mimeType || "image/png",
        });
        imgIdx++;
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Model did not return any inline images" }, { status: 502 });
    }

    return NextResponse.json({ images });
  } catch (err: any) {
    console.error("Image agent error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
