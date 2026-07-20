import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 북마크 검색 (제목, 태그, 키워드, URL)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ bookmarks: [], message: "검색어를 2글자 이상 입력해주세요." });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      status: { not: "deleted" },
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { tags: { contains: query, mode: "insensitive" } },
        { keywords: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
        { url: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ bookmarks, total: bookmarks.length });
}
