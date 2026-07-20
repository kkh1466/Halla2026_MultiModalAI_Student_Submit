import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkUrlAccessibility } from "@/lib/url-checker";
import { summarizeContent, summarizeYouTubeVideo } from "@/lib/gemini";
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeMetadata } from "@/lib/youtube-api";
import { checkDailyLimit } from "@/lib/rate-limit";

/**
 * 북마크릿 GET 방식 엔드포인트
 * 브라우저에서 직접 이 URL로 이동하므로 쿠키가 정상 전송됩니다.
 * 모든 처리를 동기로 완료한 뒤 결과를 HTML로 보여줍니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "";

  // 인증 확인
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse(
      generateHTML("❌ 로그인 필요", "AI Second Brain에 먼저 로그인해주세요."),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // URL 확인
  if (!url) {
    return new NextResponse(
      generateHTML("❌ 오류", "URL이 전달되지 않았습니다."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // URL 검증
  try {
    new URL(url);
  } catch {
    return new NextResponse(
      generateHTML("❌ 오류", "올바른 URL 형식이 아닙니다."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 이미 등록된 URL 확인
  const existing = await prisma.bookmark.findFirst({
    where: { userId: session.user.id, url, status: { not: "deleted" } },
  });

  if (existing) {
    return new NextResponse(
      generateHTML("⚠️ 이미 등록됨", "이 URL은 이미 등록되어 있습니다."),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 일일 등록 제한 확인
  const dailyLimit = await checkDailyLimit(session.user.id);
  if (!dailyLimit.allowed) {
    return new NextResponse(
      generateHTML("⚠️ 일일 한도 초과", `오늘 등록 한도(${dailyLimit.limit}건)에 도달했습니다. 내일 다시 시도해주세요.`),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // YouTube URL인 경우 공식 API 사용 (ToS 준수)
  const isYT = isYouTubeUrl(url);
  let videoTitle = title || url;
  let videoDescription = "";
  let videoThumbnail: string | undefined;
  let contentForSummary = "";

  if (isYT) {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      const meta = await getYouTubeMetadata(videoId);
      if (meta) {
        videoTitle = meta.title;
        videoDescription = meta.description;
        videoThumbnail = meta.thumbnail;
        contentForSummary = meta.description;
      }
    }
  } else {
    // 일반 웹페이지: 콘텐츠 추출
    const checkResult = await checkUrlAccessibility(url);
    if (checkResult.accessible) {
      videoTitle = checkResult.title || title || url;
      videoDescription = checkResult.description || "";
      videoThumbnail = checkResult.thumbnail;
      contentForSummary = checkResult.content || "";
    }
  }

  // 북마크 생성
  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title: videoTitle,
      description: videoDescription || undefined,
      thumbnail: videoThumbnail,
      source: "bookmarklet",
      status: "completed",
      userId: session.user.id,
    },
  });

  // AI 요약 시도
  if (contentForSummary || videoDescription) {
    try {
      const result = isYT
        ? await summarizeYouTubeVideo(videoTitle, videoDescription || contentForSummary)
        : await summarizeContent(videoTitle, contentForSummary, url);

      // 카테고리 찾기/생성
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
    } catch (error) {
      console.error("Bookmarklet AI summary error:", error);
      // AI 요약 실패해도 북마크 자체는 유지
    }
  }

  return new NextResponse(
    generateHTML("✅ 등록 완료!", `"${checkResult.title || title || url}" 저장됨`),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/**
 * 결과를 표시하고 자동으로 이전 페이지로 돌아가는 HTML 생성
 */
function generateHTML(title: string, message: string): string {
  const isError = title.includes("❌") || title.includes("⚠️");
  const bgColor = isError ? "#fef2f2" : "#f0fdf4";
  const textColor = isError ? "#991b1b" : "#166534";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Second Brain</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: ${bgColor};
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    h1 { color: ${textColor}; font-size: 1.5rem; margin: 0 0 0.5rem; }
    p { color: #374151; font-size: 0.95rem; margin: 0 0 1rem; word-break: break-all; }
    .countdown { color: #6b7280; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="countdown"><span id="sec">2</span>초 후 이전 페이지로 돌아갑니다...</p>
  </div>
  <script>
    let s = 2;
    const el = document.getElementById('sec');
    const timer = setInterval(() => {
      s--;
      el.textContent = s;
      if (s <= 0) {
        clearInterval(timer);
        history.back();
      }
    }, 1000);
  </script>
</body>
</html>`;
}
