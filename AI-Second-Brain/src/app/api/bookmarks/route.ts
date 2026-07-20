import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkUrlAccessibility } from "@/lib/url-checker";
import { summarizeContent, summarizeYouTubeVideo } from "@/lib/gemini";
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeMetadata } from "@/lib/youtube-api";
import { checkDailyLimit } from "@/lib/rate-limit";

// GET: 사용자의 북마크 목록 조회
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status") || "completed";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {
    userId: session.user.id,
    status,
  };

  if (category) {
    where.categoryId = category;
  }

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      include: { category: true, reminders: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);

  return NextResponse.json({
    bookmarks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST: 새 북마크 추가
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, source = "manual", isImportant = false } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  // URL 형식 기본 검증
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
  }

  // 이미 등록된 URL인지 확인 + 무료 플랜 제한 확인 (병렬)
  const [existing, user, dailyLimit] = await Promise.all([
    prisma.bookmark.findFirst({
      where: { userId: session.user.id, url, status: { not: "deleted" } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
    checkDailyLimit(session.user.id),
  ]);

  if (!dailyLimit.allowed) {
    return NextResponse.json(
      { error: `일일 등록 한도(${dailyLimit.limit}건)에 도달했습니다. 내일 다시 시도해주세요.` },
      { status: 429 }
    );
  }

  if (existing) {
    return NextResponse.json({ error: "이미 등록된 URL입니다.", bookmark: existing }, { status: 409 });
  }

  if (user?.plan === "free") {
    const count = await prisma.bookmark.count({
      where: { userId: session.user.id, status: { not: "deleted" } },
    });
    if (count >= (user.bookmarkLimit || 20)) {
      return NextResponse.json(
        { error: "무료 플랜의 링크 저장 한도(20개)에 도달했습니다. 프로 플랜으로 업그레이드해주세요." },
        { status: 403 }
      );
    }
  }

  // YouTube URL인 경우 공식 API 사용 (ToS 준수)
  const isYT = isYouTubeUrl(url);
  let pageTitle = url;
  let pageDescription: string | undefined;
  let pageThumbnail: string | undefined;
  let contentForSummary = "";

  if (isYT) {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      const meta = await getYouTubeMetadata(videoId);
      if (meta) {
        pageTitle = meta.title;
        pageDescription = meta.description;
        pageThumbnail = meta.thumbnail;
        contentForSummary = meta.description;
      }
    }
  } else {
    const checkResult = await checkUrlAccessibility(url);
    if (!checkResult.accessible) {
      return NextResponse.json(
        { error: checkResult.error || "이 페이지는 접근할 수 없습니다.", accessible: false },
        { status: 422 }
      );
    }
    pageTitle = checkResult.title || url;
    pageDescription = checkResult.description;
    pageThumbnail = checkResult.thumbnail;
    contentForSummary = checkResult.content || "";
  }

  // 북마크 생성
  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title: pageTitle,
      description: pageDescription,
      thumbnail: pageThumbnail,
      source,
      status: "completed",
      isImportant,
      userId: session.user.id,
    },
  });

  // AI 요약 (동기 처리 - 실패해도 북마크 자체는 저장됨)
  try {
    let result;
    if (isYT) {
      result = await summarizeYouTubeVideo(pageTitle, contentForSummary);
    } else {
      result = await summarizeContent(pageTitle, contentForSummary, url);
    }

    // 카테고리 찾기 또는 생성
    let category = await prisma.category.findUnique({
      where: { userId_name: { userId: session.user.id, name: result.category } },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: result.category, userId: session.user.id },
      });
    }

    // 요약 결과 업데이트
    await prisma.bookmark.update({
      where: { id: bookmark.id },
      data: {
        summary: result.summary,
        tags: result.tags.join(","),
        questions: JSON.stringify(result.questions),
        keywords: result.keywords.join(","),
        categoryId: category.id,
      },
    });

    // Spaced Repetition: 중요 표시된 링크에 대해 자동 리마인더 생성
    if (isImportant) {
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
            message: `"${checkResult.title || url}" - ${r.days}일 복습 리마인드`,
            userId: session.user.id,
            bookmarkId: bookmark.id,
          },
        });
      }
    }
  } catch (error) {
    console.error("AI summary error:", error);
    // AI 요약 실패해도 북마크는 이미 저장됨
  }

  // 최신 상태의 북마크를 반환
  const savedBookmark = await prisma.bookmark.findUnique({
    where: { id: bookmark.id },
    include: { category: true },
  });

  return NextResponse.json({ bookmark: savedBookmark, message: "등록되었습니다." }, { status: 201 });
}
