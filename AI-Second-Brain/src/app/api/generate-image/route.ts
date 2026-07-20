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
  const { keywords } = body;

  if (!keywords) {
    return NextResponse.json({ error: "키워드가 필요합니다." }, { status: 400 });
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Simple abstract minimal flat illustration representing: ${keywords}. No text, clean design, soft colors.`,
      size: "1024x1024",
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "이미지 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({ image: imageUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Image generation error:", msg);
    return NextResponse.json({ error: "이미지 생성 실패" }, { status: 500 });
  }
}
