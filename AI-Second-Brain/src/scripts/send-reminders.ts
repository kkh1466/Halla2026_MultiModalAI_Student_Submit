/**
 * Spaced Repetition 리마인더 발송 스크립트
 * 크론잡으로 매 시간 실행하여 예정된 알림을 발송합니다.
 *
 * 실행: npm run cron:reminders
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function sendReminders() {
  console.log("[reminders] 리마인더 확인 시작...");

  const now = new Date();

  // 현재 시간 이전에 예정되어 있고 아직 미발송인 리마인더
  const dueReminders = await prisma.reminder.findMany({
    where: {
      remindAt: { lte: now },
      isNotified: false,
    },
    include: {
      bookmark: true,
      user: true,
    },
  });

  console.log(`[reminders] ${dueReminders.length}개 리마인더 발송 예정`);

  for (const reminder of dueReminders) {
    // 앱 내 알림 생성
    await prisma.notification.create({
      data: {
        type: reminder.type.startsWith("spaced_") ? "spaced_repetition" : "reminder",
        title: getNotificationTitle(reminder.type),
        message: reminder.message || `"${reminder.bookmark.title}" 다시 볼 시간입니다.`,
        userId: reminder.userId,
        metadata: JSON.stringify({
          bookmarkId: reminder.bookmarkId,
          url: reminder.bookmark.url,
          reminderType: reminder.type,
        }),
      },
    });

    // 리마인더 발송 완료 처리
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { isNotified: true },
    });

    console.log(`[reminders] 발송 완료: ${reminder.message}`);
  }

  console.log(`[reminders] 완료. ${dueReminders.length}개 리마인더 발송.`);
  await prisma.$disconnect();
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case "spaced_1d":
      return "📗 1일 복습 리마인드";
    case "spaced_7d":
      return "📘 7일 복습 리마인드";
    case "spaced_30d":
      return "📙 30일 복습 리마인드";
    case "custom":
      return "⏰ 알림";
    default:
      return "알림";
  }
}

sendReminders().catch((e) => {
  console.error("[reminders] 오류:", e);
  prisma.$disconnect();
  process.exit(1);
});
