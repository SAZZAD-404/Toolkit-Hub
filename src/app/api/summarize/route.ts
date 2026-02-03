import { NextRequest, NextResponse } from "next/server";
import { aiManager } from "@/lib/ai-manager";
import { checkCredits, logUsageAndCharge } from "@/lib/usage";
import { creditsForTool } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tool = 'summarize';
  try {
    const { text, length } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const chk = await checkCredits({ req, tool });
    if (!chk.ok) {
      return NextResponse.json({ error: chk.error, creditsNeeded: chk.creditsNeeded, remaining: chk.remaining }, { status: chk.status });
    }

    const systemPrompt = `You are a professional text summarizer. Summarize the following text into a ${length || 'medium'} length summary.
    
    Guidelines:
    - Capture the key points and essential information.
    - Maintain a clear and concise tone.
    - Return ONLY the summary text.`;

    const result = await aiManager.generateText({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      maxTokens: 1000,
      temperature: 0.7
    });

    await logUsageAndCharge({ req, tool, status: 'success', credits: creditsForTool(tool), meta: { length: length || 'medium' } });

    return NextResponse.json({ summary: result.data });
  } catch (error: any) {
    console.error("Summarize error:", error);
    await logUsageAndCharge({ req, tool, status: 'error', credits: 0, meta: { message: error?.message } });
    return NextResponse.json({ 
      error: error?.message || "Failed to summarize text" 
    }, { status: 500 });
  }
}
