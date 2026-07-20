import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 학습 대시보드용 통계 데이터
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // 이번 주 저장한 북마크
  const weeklyBookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      status: "completed",
      createdAt: { gte: weekAgo },
    },
    include: { category: true },
  });

  // 카테고리별 통계
  const categoryStats = weeklyBookmarks.reduce<Record<string, number>>((acc, b) => {
    const cat = b.category?.name || "기타";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // 태그별 통계 (이번 주)
  const tagStats = weeklyBookmarks.reduce<Record<string, number>>((acc, b) => {
    if (b.tags) {
      b.tags.split(",").forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) acc[trimmed] = (acc[trimmed] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // 일별 저장 수 (최근 7일)
  const dailyStats: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split("T")[0];
    const count = weeklyBookmarks.filter(
      (b) => b.createdAt.toISOString().split("T")[0] === dayStr
    ).length;
    dailyStats.push({ date: dayStr, count });
  }

  // 전체 통계
  const totalBookmarks = await prisma.bookmark.count({
    where: { userId: session.user.id, status: "completed" },
  });

  const totalCategories = await prisma.category.count({
    where: { userId: session.user.id },
  });

  // 월간 저장 수
  const monthlyCount = await prisma.bookmark.count({
    where: {
      userId: session.user.id,
      status: "completed",
      createdAt: { gte: monthAgo },
    },
  });

  return NextResponse.json({
    weekly: {
      total: weeklyBookmarks.length,
      categoryStats,
      tagStats,
      dailyStats,
    },
    overall: {
      totalBookmarks,
      totalCategories,
      monthlyCount,
    },
  });
}
