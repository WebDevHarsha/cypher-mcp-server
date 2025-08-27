// app/api/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

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

    // Call Gemini image-capable model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        // Request both text and image so we can capture image inline data
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Find first candidate and collect image parts
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts || !Array.isArray(candidate.content.parts)) {
      return NextResponse.json({ error: "No content returned from image model" }, { status: 502 });
    }

    // There may be multiple parts—find inline Data and return base64
    const images: Array<{ filename: string; b64: string; mime?: string }> = [];
    let imgIdx = 0;
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        const b64 = part.inlineData.data;
        // Optionally save server-side for debugging (commented out)
        // const buffer = Buffer.from(b64, 'base64');
        // const filename = `gen-image-${Date.now()}-${imgIdx}.png`;
        // fs.writeFileSync(`/tmp/${filename}`, buffer);

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
