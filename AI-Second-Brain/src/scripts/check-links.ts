/**
 * 링크 유효성 검사 스크립트
 * 크론잡으로 매일 실행하여 삭제되거나 날아간 URL을 감지하고
 * 사용자에게 알림을 보냅니다.
 *
 * 실행: npm run cron:check-links
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLinks() {
  console.log("[check-links] 링크 유효성 검사 시작...");

  // 최근 7일 이내에 체크하지 않은 completed 상태 북마크
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      status: "completed",
      OR: [
        { lastChecked: null },
        { lastChecked: { lt: sevenDaysAgo } },
      ],
    },
    take: 100, // 한 번에 100개씩 처리
  });

  console.log(`[check-links] ${bookmarks.length}개 북마크 검사 예정`);

  let deletedCount = 0;

  for (const bookmark of bookmarks) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(bookmark.url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AISecondBrain/1.0; link-checker)",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404 || response.status === 410) {
        // 페이지 삭제됨
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { status: "deleted", lastChecked: new Date() },
        });

        // 사용자에게 알림 생성
        await prisma.notification.create({
          data: {
            type: "link_deleted",
            title: "링크가 삭제되었습니다",
            message: `"${bookmark.title || bookmark.url}" 페이지가 더 이상 존재하지 않아 대시보드에서 제거되었습니다.`,
            userId: bookmark.userId,
            metadata: JSON.stringify({ bookmarkId: bookmark.id, url: bookmark.url }),
          },
        });

        deletedCount++;
        console.log(`[check-links] 삭제 감지: ${bookmark.url}`);
      } else {
        // 정상 → lastChecked 업데이트
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { lastChecked: new Date() },
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // 타임아웃 - 일시적 문제일 수 있으므로 3회 연속 실패 시에만 삭제 처리
        // 지금은 단순히 lastChecked만 업데이트
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { lastChecked: new Date() },
        });
      }
    }

    // 서버 부하 방지를 위한 딜레이
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[check-links] 완료. ${deletedCount}개 링크 삭제 감지.`);
  await prisma.$disconnect();
}

checkLinks().catch((e) => {
  console.error("[check-links] 오류:", e);
  prisma.$disconnect();
  process.exit(1);
});
