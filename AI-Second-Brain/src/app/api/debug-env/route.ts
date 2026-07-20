import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const keyPreview = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : "(없음)";

  const result: Record<string, unknown> = { hasKey: !!apiKey, keyPreview };

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say hi in one word." }],
        max_tokens: 5,
      });
      result.success = true;
      result.response = response.choices[0]?.message?.content;
    } catch (error: unknown) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
    }
  }

  return NextResponse.json(result);
}
