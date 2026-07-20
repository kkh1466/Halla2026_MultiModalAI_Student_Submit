import { prisma } from "@/lib/prisma";

const DAILY_LIMIT = 30; // 무료 플랜 일일 등록 제한

/**
 * 사용자의 일일 북마크 등록 횟수를 확인합니다.
 * 오늘 00:00부터 현재까지 생성된 북마크 수를 카운트합니다.
 */
export async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = await prisma.bookmark.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });

  return {
    allowed: todayCount < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - todayCount),
    limit: DAILY_LIMIT,
  };
}
