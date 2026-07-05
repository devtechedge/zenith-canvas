import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the GoogleGenAI server client
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
    const { prompt, canvasTitle, canvasElements } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter." }, { status: 400 });
    }

    // Prepare active canvas context
    const contextString = canvasElements && Array.isArray(canvasElements)
      ? canvasElements.map((el: any) => `Block (${el.type}): ${el.content}`).join("\n")
      : "No active blocks.";

    const systemInstruction = `You are the Zenith Canvas Core AI Catalyst.
You analyze the user's active canvas workspace blocks and suggest highly structured extensions, documentation summaries, sandboxes, or checklists.
Your output must be structured, professional, and readable.
Since the user can instantly merge your suggestions back into their live Dexie workspace, try to output structured sections. 
Each section or block of your response should look like:
[TYPE: heading_2] <Header text>
[TYPE: text] <Paragraph text>
[TYPE: todo] <Task checkbox text>
[TYPE: callout] <High-polish summary tip or alert>
[TYPE: code_sandbox] <Executable JS script without markdown backticks>

Always follow this [TYPE: <type>] format for every single output block so our frontend can cleanly parse your response. Never write standard markdown without these TYPE labels. Do not use markdown backticks for code blocks, write the raw code directly after [TYPE: code_sandbox].`;

    const fullPrompt = `Active Canvas Title: "${canvasTitle || 'Untitled Canvas'}"
Active Workspace Content:
---
${contextString}
---

User Prompt Request: ${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Catalyst Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI catalyst assistance." }, { status: 500 });
  }
}
