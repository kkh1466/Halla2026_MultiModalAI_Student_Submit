import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// GET: 지식 그래프 데이터 기반 마인드맵 구조 생성
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, status: "completed" },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (bookmarks.length === 0) {
    return NextResponse.json({ error: "마인드맵을 생성하려면 북마크를 추가해주세요." }, { status: 400 });
  }

  // 카테고리별 키워드 수집
  const categoryKeywords: Record<string, string[]> = {};
  for (const b of bookmarks) {
    const cat = b.category?.name || "기타";
    if (!categoryKeywords[cat]) categoryKeywords[cat] = [];
    if (b.keywords) {
      const kws = b.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      categoryKeywords[cat].push(...kws);
    }
  }

  // 각 카테고리의 상위 키워드 추출 (빈도 기반)
  const mindmapData: { label: string; children: { label: string; children: { label: string; children: never[] }[] }[] } = {
    label: "내 지식",
    children: [],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    // 키워드 빈도 계산
    const freq = new Map<string, number>();
    keywords.forEach((kw) => freq.set(kw, (freq.get(kw) || 0) + 1));

    // 상위 5개 키워드
    const topKeywords = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => ({ label: kw, children: [] as never[] }));

    if (topKeywords.length > 0) {
      mindmapData.children.push({
        label: category,
        children: topKeywords,
      });
    }
  }

  // AI 없이도 동작하도록 기본 구조 반환 (할당량 절약)
  // AI가 필요한 경우 별도 요청으로 처리 가능
  return NextResponse.json({ mindmap: mindmapData });
}
