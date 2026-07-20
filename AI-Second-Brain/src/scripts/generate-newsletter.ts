import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

async function generateNewsletters() {
  console.log("[newsletter] 주간 뉴스레터 생성 시작...");

  const users = await prisma.user.findMany({ where: { newsletterEnabled: true } });
  console.log(`[newsletter] ${users.length}명의 사용자 대상`);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  for (const user of users) {
    try {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: user.id, status: "completed", createdAt: { gte: weekStart } },
        include: { category: true },
      });

      if (bookmarks.length === 0) {
        console.log(`[newsletter] ${user.name || user.id}: 이번 주 북마크 없음`);
        continue;
      }

      const info = bookmarks.map((b, i) => `[${i + 1}] ${b.category?.name || "기타"}|${b.title}: ${b.summary}`).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `이번 주 학습 현황 3줄 정리. 서론 없이.\n${info}\n\n형식: 관심분야(1줄), 핵심학습(1줄), 추천(1줄)` }],
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content?.trim() || "";

      await prisma.newsletter.create({
        data: {
          title: `주간 뉴스레터 (${weekStart.toLocaleDateString("ko-KR")} ~ ${now.toLocaleDateString("ko-KR")})`,
          content,
          weekStart,
          weekEnd: now,
          userId: user.id,
        },
      });

      await prisma.notification.create({
        data: {
          type: "newsletter",
          title: "📬 주간 뉴스레터가 준비되었습니다",
          message: "이번 주 저장한 콘텐츠의 핵심 요약을 확인하세요.",
          userId: user.id,
        },
      });

      console.log(`[newsletter] ${user.name || user.id}: 완료`);
    } catch (error) {
      console.error(`[newsletter] ${user.name || user.id}: 오류 -`, error);
    }
  }

  console.log("[newsletter] 완료.");
  await prisma.$disconnect();
}

generateNewsletters().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
