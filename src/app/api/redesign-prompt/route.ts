import { NextRequest, NextResponse } from "next/server";
import { aiManager } from "@/lib/ai-manager";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { prompt, tone } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const systemPrompt = `You are a professional prompt engineer. Your goal is to redesign the user's prompt to be more ${tone || 'professional'}, detailed, and effective for AI models.
    
    Guidelines:
    - Add specific details, context, and constraints.
    - Improve the structure and clarity.
    - Ensure it follows best practices for prompting.
    - Return ONLY the enhanced prompt text.`;

    const result = await aiManager.generateText({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      maxTokens: 1500,
      temperature: 0.8
    });

    return NextResponse.json({ enhanced: result.data });
  } catch (error: any) {
    console.error("Redesign prompt error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to redesign prompt" 
    }, { status: 500 });
  }
}
