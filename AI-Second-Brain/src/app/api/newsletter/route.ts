import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNewsletterContent } from "@/lib/gemini";

// GET: 사용자의 뉴스레터 목록
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newsletters = await prisma.newsletter.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ newsletters });
}

// DELETE: 뉴스레터 삭제
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "뉴스레터 ID가 필요합니다." }, { status: 400 });
  }

  // 본인의 뉴스레터인지 확인
  const newsletter = await prisma.newsletter.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!newsletter) {
    return NextResponse.json({ error: "뉴스레터를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.newsletter.delete({ where: { id } });

  return NextResponse.json({ message: "삭제되었습니다." });
}

// POST: 뉴스레터 수동 생성 (이번 주 기준)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  // 이번 주 완료된 북마크들
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      status: "completed",
      createdAt: { gte: weekStart },
    },
    include: { category: true },
  });

  if (bookmarks.length === 0) {
    return NextResponse.json(
      { error: "이번 주 저장된 북마크가 없습니다." },
      { status: 400 }
    );
  }

  const content = await generateNewsletterContent(
    bookmarks.map((b) => ({
      title: b.title || "제목 없음",
      summary: b.summary || "",
      category: b.category?.name || "기타",
      tags: b.tags || "",
      url: b.url,
    }))
  );

  const newsletter = await prisma.newsletter.create({
    data: {
      title: `AI Second Brain 주간 뉴스레터 (${weekStart.toLocaleDateString("ko-KR")} ~ ${now.toLocaleDateString("ko-KR")})`,
      content,
      weekStart,
      weekEnd: now,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ newsletter }, { status: 201 });
}
