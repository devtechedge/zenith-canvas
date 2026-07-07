import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize GoogleGenAI client with the server-only secret
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text parameter to translate." }, { status: 400 });
    }

    if (!targetLanguage) {
      return NextResponse.json({ error: "Missing targetLanguage parameter." }, { status: 400 });
    }

    const systemInstruction = `You are an expert, fluent multilingual translator.
Translate the user's input text precisely and naturally into the target language.
Preserve any formatting, markdown list structures (e.g. "- [ ]" or "- "), headings, and spacing exactly.
Do not add any explanations, introductory text, or surrounding markdown codeblocks. Output ONLY the raw translated text.`;

    const userPrompt = `Target Language: ${targetLanguage}\n\nText to translate:\n${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    const translatedText = response.text || text;

    return NextResponse.json({ text: translatedText });
  } catch (error: any) {
    console.error("Gemini Translation API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to translate text." }, { status: 500 });
  }
}
