import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

export async function generateText(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text;
}

export async function generateImage(prompt: string) {
  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: { numberOfImages: 1 },
  });

  const img =
    response.generatedImages &&
    response.generatedImages[0] &&
    response.generatedImages[0].image &&
    response.generatedImages[0].image.imageBytes;

  return img ? `data:image/png;base64,${img}` : null;
}
