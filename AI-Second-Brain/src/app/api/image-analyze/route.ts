import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { image, mode } = body;

  if (!image) {
    return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
  }

  const prompt = mode === "ocr"
    ? "이 이미지에서 텍스트를 추출하고 핵심을 3줄로 요약해주세요."
    : "이 이미지를 분석해주세요. 무엇이 있는지 설명하고 주요 키워드 3개를 알려주세요.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const result = response.choices[0]?.message?.content?.trim() || "분석 결과를 생성할 수 없습니다.";
    return NextResponse.json({ result, mode });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Image analysis error:", msg);
    return NextResponse.json({ error: "이미지 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
