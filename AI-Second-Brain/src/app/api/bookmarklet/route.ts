import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkUrlAccessibility } from "@/lib/url-checker";
import { summarizeContent } from "@/lib/gemini";

/**
 * 북마크릿에서 호출되는 API
 * CORS 헤더를 포함하여 외부 사이트에서 호출 가능하도록 함
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  // CORS 헤더
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
  };

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "로그인이 필요합니다. AI Second Brain에 먼저 로그인해주세요." },
      { status: 401, headers }
    );
  }

  const body = await request.json();
  const { url, title: pageTitle } = body;

  if (!url) {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400, headers });
  }

  // URL 검증
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "올바른 URL이 아닙니다." }, { status: 400, headers });
  }

  // 이미 등록된 URL 확인
  const existing = await prisma.bookmark.findFirst({
    where: { userId: session.user.id, url, status: { not: "deleted" } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "이미 등록된 URL입니다.", bookmark: existing },
      { status: 409, headers }
    );
  }

  // 북마크릿은 브라우저에서 호출하므로 페이지가 접근 가능한 것이 확인됨
  // 즉시 북마크 생성하고 응답 반환
  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title: pageTitle || url,
      source: "bookmarklet",
      status: "pending",
      userId: session.user.id,
    },
  });

  // 비동기로 콘텐츠 추출 + 요약 처리
  processBookmarkletAsync(bookmark.id, url, pageTitle || "", session.user.id);

  return NextResponse.json(
    { message: "등록되었습니다!", bookmark },
    { status: 201, headers }
  );
}

/**
 * 북마크릿 백그라운드 처리
 */
async function processBookmarkletAsync(
  bookmarkId: string,
  url: string,
  pageTitle: string,
  userId: string
) {
  try {
    // 콘텐츠 추출
    const checkResult = await checkUrlAccessibility(url);

    if (!checkResult.accessible) {
      await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { status: "failed", summary: checkResult.error },
      });
      return;
    }

    // 메타데이터 업데이트
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        title: checkResult.title || pageTitle || url,
        description: checkResult.description,
        thumbnail: checkResult.thumbnail,
      },
    });

    // AI 요약
    const result = await summarizeContent(
      checkResult.title || pageTitle || "",
      checkResult.content || "",
      url
    );

    // 카테고리 찾기/생성
    let category = await prisma.category.findUnique({
      where: { userId_name: { userId, name: result.category } },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: result.category, userId },
      });
    }

    // DB 업데이트
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        summary: result.summary,
        tags: result.tags.join(","),
        questions: JSON.stringify(result.questions),
        keywords: result.keywords.join(","),
        categoryId: category.id,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Bookmarklet processing error:", error);
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { status: "failed" },
    });
  }
}
