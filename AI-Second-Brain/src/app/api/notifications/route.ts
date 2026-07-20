import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 사용자의 알림 목록 조회
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (unreadOnly) where.isRead = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH: 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notificationIds } = body;

  if (Array.isArray(notificationIds)) {
    await prisma.notification.updateMany({
      where: { id: { in: notificationIds }, userId: session.user.id },
      data: { isRead: true },
    });
  } else {
    // 모든 알림 읽음 처리
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ message: "읽음 처리되었습니다." });
}
