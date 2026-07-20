import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 단일 북마크 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { category: true, reminders: true },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "북마크를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ bookmark });
}

// PATCH: 북마크 수정 (중요 표시, 카테고리 변경 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "북마크를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const { isImportant, categoryId } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof isImportant === "boolean") updateData.isImportant = isImportant;
  if (categoryId !== undefined) updateData.categoryId = categoryId;

  // 중요 표시 시 Spaced Repetition 리마인더 자동 생성
  if (isImportant === true && !bookmark.isImportant) {
    const now = new Date();
    const reminders = [
      { type: "spaced_1d", days: 1 },
      { type: "spaced_7d", days: 7 },
      { type: "spaced_30d", days: 30 },
    ];

    for (const r of reminders) {
      const remindAt = new Date(now);
      remindAt.setDate(remindAt.getDate() + r.days);
      await prisma.reminder.create({
        data: {
          remindAt,
          type: r.type,
          message: `"${bookmark.title}" - ${r.days}일 복습 리마인드`,
          userId: session.user.id,
          bookmarkId: bookmark.id,
        },
      });
    }
  }

  // 중요 해제 시 미발송 리마인더 삭제
  if (isImportant === false && bookmark.isImportant) {
    await prisma.reminder.deleteMany({
      where: {
        bookmarkId: bookmark.id,
        type: { startsWith: "spaced_" },
        isNotified: false,
      },
    });
  }

  const updated = await prisma.bookmark.update({
    where: { id: params.id },
    data: updateData,
    include: { category: true },
  });

  return NextResponse.json({ bookmark: updated });
}

// DELETE: 북마크 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "북마크를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.bookmark.delete({ where: { id: params.id } });

  // 해당 카테고리에 남은 북마크가 없으면 카테고리도 삭제
  if (bookmark.categoryId) {
    const remaining = await prisma.bookmark.count({
      where: { categoryId: bookmark.categoryId, userId: session.user.id },
    });
    if (remaining === 0) {
      await prisma.category.delete({ where: { id: bookmark.categoryId } });
    }
  }

  return NextResponse.json({ message: "삭제되었습니다." });
}
