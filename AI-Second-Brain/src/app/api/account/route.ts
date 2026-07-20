import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE: 계정 및 모든 관련 데이터 영구 삭제
 * 개인정보보호법 준수 - 사용자 요청 시 모든 데이터 삭제
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 관련 데이터 모두 삭제 (cascade로 처리되지만 명시적으로)
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.newsletter.deleteMany({ where: { userId } }),
    prisma.reminder.deleteMany({ where: { userId } }),
    prisma.bookmark.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ message: "계정이 삭제되었습니다." });
}
