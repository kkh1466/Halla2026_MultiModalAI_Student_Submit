import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bookmarkIds } = body;

  if (!Array.isArray(bookmarkIds) || bookmarkIds.length < 2) {
    return NextResponse.json({ error: "2개 이상의 북마크를 선택해주세요." }, { status: 400 });
  }

  if (bookmarkIds.length > 10) {
    return NextResponse.json({ error: "최대 10개까지 선택 가능합니다." }, { status: 400 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { id: { in: bookmarkIds }, userId: session.user.id, status: "completed" },
    include: { category: true },
  });

  if (bookmarks.length < 2) {
    return NextResponse.json({ error: "요약 완료된 북마크 2개 이상 선택해주세요." }, { status: 400 });
  }

  const info = bookmarks.map((b, i) => `[${i + 1}] ${b.category?.name || "기타"} | ${b.title}: ${b.summary}`).join("\n");
  const categories = [...new Set(bookmarks.map((b) => b.category?.name || "기타"))];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `아래 자료를 3줄로 종합 분석. 서론 없이 본론만.\n${info}\n\n형식: 공통주제(1줄), 핵심(1줄), 인사이트(1줄)` }],
      max_tokens: 300,
    });

    const report = response.choices[0]?.message?.content?.trim() || "보고서를 생성할 수 없습니다.";
    return NextResponse.json({ report, categories });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Report error:", msg);
    return NextResponse.json({ error: "보고서 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
