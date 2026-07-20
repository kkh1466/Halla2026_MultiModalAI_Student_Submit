import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 사용자의 카테고리 목록 (북마크 수 포함, 빈 카테고리 자동 정리)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 빈 카테고리 삭제 (북마크가 0개인 카테고리 정리)
  await prisma.category.deleteMany({
    where: {
      userId: session.user.id,
      bookmarks: { none: {} },
    },
  });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { bookmarks: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}
