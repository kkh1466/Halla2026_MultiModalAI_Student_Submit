import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST: 통합 보고서를 "통합 보고서" 카테고리에 북마크로 저장
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: "보고서 내용이 필요합니다." }, { status: 400 });
  }

  // "통합 보고서" 카테고리 찾기/생성
  let category = await prisma.category.findUnique({
    where: { userId_name: { userId: session.user.id, name: "통합 보고서" } },
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: "통합 보고서", color: "#8b5cf6", userId: session.user.id },
    });
  }

  // 보고서를 북마크로 저장
  const now = new Date();
  await prisma.bookmark.create({
    data: {
      url: `report://${now.getTime()}`,
      title: `통합 분석 보고서 (${now.toLocaleDateString("ko-KR")})`,
      summary: content,
      source: "report",
      status: "completed",
      categoryId: category.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ message: "저장되었습니다." }, { status: 201 });
}
