import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 사용자의 리마인더 목록 조회 (예정된 것)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: session.user.id,
      isNotified: false,
    },
    include: { bookmark: true },
    orderBy: { remindAt: "asc" },
  });

  return NextResponse.json({ reminders });
}

// POST: 사용자 정의 리마인더 생성
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bookmarkId, remindAt, message } = body;

  if (!bookmarkId || !remindAt) {
    return NextResponse.json(
      { error: "bookmarkId와 remindAt이 필요합니다." },
      { status: 400 }
    );
  }

  // 북마크 소유권 확인
  const bookmark = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId: session.user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "북마크를 찾을 수 없습니다." }, { status: 404 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      remindAt: new Date(remindAt),
      message: message || `"${bookmark.title}" 다시 볼 시간입니다`,
      type: "custom",
      userId: session.user.id,
      bookmarkId,
    },
  });

  return NextResponse.json({ reminder }, { status: 201 });
}
