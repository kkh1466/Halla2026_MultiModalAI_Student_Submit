export interface UrlCheckResult {
  accessible: boolean;
  title?: string;
  description?: string;
  thumbnail?: string;
  content?: string;
  error?: string;
}

/**
 * URL에 접근하여 공개 페이지인지 확인하고 메타데이터를 추출합니다.
 * 비공개 페이지(로그인 필요)는 접근 불가로 판정합니다.
 */
export async function checkUrlAccessibility(
  url: string
): Promise<UrlCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃 (10→5초)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AISecondBrain/1.0; +https://ai-second-brain.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 401, 403 → 접근 불가
    if (response.status === 401 || response.status === 403) {
      return {
        accessible: false,
        error:
          "이 페이지는 로그인이 필요하거나 비공개 콘텐츠로, AI가 내용을 읽을 수 없습니다.",
      };
    }

    // 200이 아닌 경우
    if (!response.ok) {
      return {
        accessible: false,
        error: `페이지에 접근할 수 없습니다. (상태 코드: ${response.status})`,
      };
    }

    const html = await response.text();

    // 로그인 페이지로 리다이렉트된 경우 감지
    if (isLoginPage(html, response.url)) {
      return {
        accessible: false,
        error:
          "이 페이지는 로그인이 필요하거나 비공개 콘텐츠로, AI가 내용을 읽을 수 없습니다.",
      };
    }

    // 메타데이터 추출
    const metadata = extractMetadata(html);
    const content = extractTextContent(html);

    return {
      accessible: true,
      title: metadata.title,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      content: content.slice(0, 5000), // 최대 5000자
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        accessible: false,
        error: "페이지 응답 시간이 초과되었습니다.",
      };
    }
    return {
      accessible: false,
      error: "페이지에 접근할 수 없습니다.",
    };
  }
}

/**
 * URL 기본 접근 가능 여부만 빠르게 확인 (HEAD 요청)
 * 메타데이터는 가져오지 않습니다.
 */
export async function quickCheckUrl(url: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초 타임아웃

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AISecondBrain/1.0; +https://ai-second-brain.com)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        accessible: false,
        error: "이 페이지는 로그인이 필요하거나 비공개 콘텐츠입니다.",
      };
    }

    if (!response.ok) {
      return {
        accessible: false,
        error: `페이지에 접근할 수 없습니다. (상태 코드: ${response.status})`,
      };
    }

    return { accessible: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      // HEAD 타임아웃이면 일단 접근 가능으로 간주하고 백그라운드에서 재시도
      return { accessible: true };
    }
    return {
      accessible: false,
      error: "페이지에 접근할 수 없습니다.",
    };
  }
}

/**
 * 로그인 페이지인지 간단히 판단
 */
function isLoginPage(html: string, finalUrl: string): boolean {
  const loginIndicators = [
    "login",
    "signin",
    "sign-in",
    "sign_in",
    "로그인",
    "nid.naver.com",
    "accounts.google.com/signin",
  ];

  const lowerUrl = finalUrl.toLowerCase();
  const lowerHtml = html.toLowerCase().slice(0, 5000);

  for (const indicator of loginIndicators) {
    if (lowerUrl.includes(indicator)) {
      // URL에 로그인 관련 문자열이 포함된 경우
      // 단, 원래 URL이 로그인 관련 콘텐츠일 수 있으므로 form도 함께 체크
      if (
        lowerHtml.includes('<form') &&
        (lowerHtml.includes('password') || lowerHtml.includes('passwd'))
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * HTML에서 Open Graph 및 기본 메타태그 추출
 */
function extractMetadata(html: string): {
  title?: string;
  description?: string;
  thumbnail?: string;
} {
  const titleMatch =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/) ||
    html.match(/<title>([^<]*)<\/title>/);

  const descMatch =
    html.match(
      /<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)  ||
    html.match(
      /<meta[^>]*content="([^"]*)"[^>]*property="og:description"/) ||
    html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/);

  const thumbMatch =
    html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/);

  return {
    title: decodeHtmlEntities(titleMatch?.[1]?.trim()),
    description: decodeHtmlEntities(descMatch?.[1]?.trim()),
    thumbnail: thumbMatch?.[1]?.trim(),
  };
}

/**
 * HTML 엔티티를 일반 문자로 디코딩
 */
function decodeHtmlEntities(str?: string): string | undefined {
  if (!str) return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * HTML에서 본문 텍스트만 추출 (광고/배너/불필요 요소 제거)
 */
function extractTextContent(html: string): string {
  // 광고 및 불필요한 영역 제거 (class/id 기반)
  let text = html
    // 광고 관련 요소 제거
    .replace(/<(div|section|aside|ins|iframe)[^>]*(ad[s\-_]?|advertisement|banner|sponsor|promo|commercial|google_ad|adsbygoogle|ad-slot|ad-unit|ad-container|dfp-ad)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // 소셜 미디어 공유 버튼, 위젯 제거
    .replace(/<(div|section)[^>]*(social|share|sharing|widget|sidebar|related-posts|recommended|popup|modal|cookie|consent)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // 댓글 영역 제거
    .replace(/<(div|section)[^>]*(comment|disqus|livere)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // script, style, nav, header, footer, aside 태그 제거
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // 모든 HTML 태그 제거
  text = text.replace(/<[^>]+>/g, " ");

  // HTML 엔티티 디코딩
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 연속 공백/줄바꿈 정리
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
