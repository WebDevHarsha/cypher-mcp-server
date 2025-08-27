// app/api/creative/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const research = body?.research;
    const topic = body?.topic || "untitled";

    if (!research) {
      return NextResponse.json({ error: "Missing `research` in body" }, { status: 400 });
    }

    // Prompt to create 3 platform-specific captions plus an image prompt
    const prompt = `
You are a creative social media copywriter and visual director.
Given the following research notes, produce:
1) A short, tweet-ready caption (<= 280 chars) with 1-2 hashtags.
2) An Instagram caption (longer, with a hook + 3-5 hashtags).
3) A LinkedIn caption (professional tone, 2-4 sentences).
4) A concise image generation prompt (1-2 sentences) that an image-generation agent can use to create a strong visual for the post.

Research:
${research}

Instructions:
- Return JSON ONLY in this exact shape:
{
  "twitter": "...",
  "instagram": "...",
  "linkedin": "...",
  "imagePrompt": "..."
}
Ensure captions are different and tailored to platform tone. Use the topic "${topic}" in at least one caption.
`;

    const gResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // If you want grounding tools, add them here as needed
      },
    });

    // `response.text()` or candidate parts may work depending on SDK; handle both
    const rawText =
      gResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from model output (best-effort)
    let parsed: any = null;
    try {
      // Models sometimes prepend/explain; find first { ... } block
      const jsonStart = rawText.indexOf("{");
      const jsonSub = jsonStart >= 0 ? rawText.slice(jsonStart) : rawText;
      parsed = JSON.parse(jsonSub);
    } catch (e) {
      // fallback: attempt to extract fields with regex (best-effort)
      const twitterMatch = rawText.match(/"twitter"\s*:\s*"([^"]+)"/);
      const instagramMatch = rawText.match(/"instagram"\s*:\s*"([^"]+)"/);
      const linkedinMatch = rawText.match(/"linkedin"\s*:\s*"([^"]+)"/);
      const imagePromptMatch = rawText.match(/"imagePrompt"\s*:\s*"([^"]+)"/);

      parsed = {
        twitter: twitterMatch ? twitterMatch[1] : null,
        instagram: instagramMatch ? instagramMatch[1] : null,
        linkedin: linkedinMatch ? linkedinMatch[1] : null,
        imagePrompt: imagePromptMatch ? imagePromptMatch[1] : null,
        raw: rawText,
      };
    }

    // Ensure imagePrompt exists
    if (!parsed?.imagePrompt) {
      // If model didn't produce, craft a simple fallback image prompt from research
      parsed.imagePrompt = `High-quality, eye-catching image representing ${topic}. Use bold colors and an engaging composition that fits social media.`;
    }

    // Call internal image agent to generate image(s)
    // Build absolute origin from incoming request so internal call works both locally & deployed
    const reqUrl = new URL(req.url);
    const origin = reqUrl.origin;
    const imageRes = await fetch(`${origin}/api/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: parsed.imagePrompt }),
    });

    let imagePayload = null;
    if (imageRes.ok) {
      imagePayload = await imageRes.json();
    } else {
      console.warn("Image agent returned non-OK:", await imageRes.text());
    }

    // Return aggregated creative result
    return NextResponse.json({
      topic,
      twitter: parsed.twitter || parsed.twitter === "" ? parsed.twitter : null,
      instagram: parsed.instagram || parsed.instagram === "" ? parsed.instagram : null,
      linkedin: parsed.linkedin || parsed.linkedin === "" ? parsed.linkedin : null,
      imagePrompt: parsed.imagePrompt,
      images: imagePayload?.images || [],
      rawModelOutput: parsed.raw || rawText,
    });
  } catch (err: any) {
    console.error("Creative agent error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
